import react, { useEffect, useState } from 'react';
import socketIo, { Socket } from 'socket.io-client';
import Status from 'components/status';
import Peer, { ConnectionOffer } from 'components/peer';
import { DefaultEventsMap } from 'socket.io-client/build/typed-events';

const ENDPOINT = 'ws://localhost:8080';


function removeByValue<T>(array: T[], value: T) {
    const copy = [...array];
    const index = copy.indexOf(value);
    if (index !== -1) {
        copy.splice(index, 1);
    }
    return copy;
}

type AnswersMap = {
    [key: string]: any; // (any -> RTCAnswer)
}

type RequestMap = {
    [key: string]: any; // (any -> RTCRequest(offer))
}

const HomeScreen: React.FC = () => {


    const [isConnected, setConnected] = useState(false);
    const [peers, setPeers] = useState<string[]>([]);
    const [sIo, setSocketIo] = useState<Socket<DefaultEventsMap, DefaultEventsMap> | undefined>(undefined);
    const [peerAnswers, setPeerAnswers] = useState<AnswersMap>({});
    const [peerRequets, setPeerRequests] = useState<RequestMap>({});

    useEffect(() => {
        // on init;
        const io = socketIo(ENDPOINT);
        io.on('connect', () => setConnected(true));


        io.on('sockets-list', (message: any) => setPeers(message))

        io.on('socket-joined', (message: any) => {
            console.log(message);
            setPeers(peers => [...peers, message.socketId]);
        });

        io.on('socket-disconnected', (message: any) => {
            setPeers(peers => removeByValue(peers, message));
        });

        io.on('request-connection', request => {


            setPeerRequests(requests => ({
                ...requests,
                [request.callerId]: request.request
            }));
            // const answer = acceptRequest(request);

            // io.emit('connection-accepted', answer);
        });


        io.on('connection-accepted', answer => {
            setPeerAnswers(answers => ({
                ...answers,
                [answer.receiverId]: answer.answer
            }))
        })

        setSocketIo(io);

    }, []);

    const connectToSocket = (socketId: string, offer: ConnectionOffer) => {
        if (sIo) {
            sIo.emit('request-connection', {
                receiverId: socketId,
                request: offer
            });
        }
    }

    const acceptSocketRequest = (socketId: string, answer: ConnectionOffer) => {

        if (!sIo) return;
        sIo.emit('connection-accepted', {
            callerId: socketId,
            answer
        });
    }

    return (
        <div>
            <div>
                <Status
                    text="Is connected to WS server"
                    value={isConnected} />
            </div>
            {
                peers.map(peer => (
                    <Peer
                        id={peer}
                        requestCallback={connectToSocket}
                        acceptCallback={acceptSocketRequest}

                        request={peerRequets[peer]}
                        answer={peerAnswers[peer]}

                    />

                ))
            }
        </div>
    );
}


export default HomeScreen;
