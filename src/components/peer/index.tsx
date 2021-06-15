import react, {useEffect, useRef, useState} from 'react';
import Status from '../status';


const getUserMedia: typeof navigator.getUserMedia = navigator.getUserMedia;
// (
//     navigator.getUserMedia ||
//     navigator.mediaDevices?.getUserMedia ||
//     navigator.webkitGetUserMedia ||
//     navigator.mozGetUserMedia ||
//     navigator.msGetUserMedia
// );


export type ConnectionOffer = RTCSessionDescriptionInit;
export type ConnectionAccepted = ConnectionOffer;
export type IceCandidate = RTCIceCandidate;

interface PeerComponentProps {
    id: string;
    requestCallback: (socketId: string, offer: ConnectionOffer) => void;
    acceptCallback: (socketId: string, offer: ConnectionAccepted) => void;
    iceCandidateCallback: (socketId: string, candidate: IceCandidate) => void;
    iceCandidate: IceCandidate;
    request: any;
    answer: any;

}


const offerOptions = {
    offerToReceiveAudio: true,
    offerToReceiveVideo: true,
};

const {RTCPeerConnection, RTCSessionDescription} = window;


let queue: any[] = [];

function setProcessCandidates(iceCandidates: any[]) {
    queue = iceCandidates;
}

let lock = false;

async function processCandidates(peerConnection: any) {
    if (!peerConnection) return;
    while (queue.length == 2 && !lock) {
        // while(lock) {}
        const candidate = queue[1];
        if (!candidate) return;

        console.log('process-candidate');
        lock = true;
        await peerConnection.addIceCandidate(candidate);
        // lock = false;
        console.log('process-candidate-finish');
    }
}


const PeerComponent: React.FC<PeerComponentProps> = props => {

    const {
        id,
        requestCallback,
        acceptCallback,
        iceCandidate,
        iceCandidateCallback,
        request,
        answer,
    } = props;

    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();
const [isConnected, setIsConnected] = useState(false);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);


    useEffect(() => {
        const pConnection = new RTCPeerConnection({});


        // rtpTransceiver.receiver.

        setPeerConnection(pConnection);
        setListener(pConnection);
        pConnection.onicecandidate = (t) => t.candidate && iceCandidateCallback(id, t.candidate);

        pConnection.onnegotiationneeded = async () => {
            console.log('negotiation');
        };
        setStream(pConnection);


        pConnection.addEventListener('connectionstatechange', event => {
            if (pConnection.connectionState === 'connected') {
                setIsConnected(true);
            }
        });

        // setProcessCandidates(iceCandidates);
    }, []);

    const setVideoStream = (video: react.RefObject<HTMLVideoElement>, stream: MediaStream) => {
        if (video.current) {
            console.log('set-src-object');
            video.current.srcObject = stream;
        }
    };

    const connectToSocket = async () => {
        if (!peerConnection) return;

        const offer = await peerConnection.createOffer(offerOptions);
        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

        requestCallback(id, offer);
    };

    const acceptRequest = async () => {
        if (!peerConnection) return;
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(request),
        );



        const answer = await peerConnection.createAnswer();
        console.log(answer);
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

        acceptCallback(id, answer);

    };

    const startCall = async () => {
        console.log('do-start-call');
        if (!peerConnection) return;
        console.log('startCall', answer);

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer),
        );
    };

    useEffect(() => {
        startCall();
    }, [answer]);

    const [iceCandidates, setIceCandidates] = useState<IceCandidate[]>([]);
    useEffect(() => {
        console.log('add-candidate', iceCandidate);
        if (iceCandidate) {
            peerConnection?.addIceCandidate(iceCandidate);
        }
        // setIceCandidates(candidates => {
        // candidates.push(iceCandidate);
        // processCandidates(iceCandidate);

        // return candidates;
        // });
    }, [iceCandidate]);


    const setListener = (pConnection = peerConnection) => {
        if (!pConnection) return;
        console.log(pConnection);
        pConnection.ontrack = function ({streams: [stream]}) {
            console.log('on-track');
            setVideoStream(remoteVideoRef, stream);
        };
    };

    const setStream = (pConnection = peerConnection) => {
        if (!pConnection) return;
        navigator.mediaDevices.getUserMedia(
            {
                video: true,
                audio: true,
            },
        ).then(stream => {
            setVideoStream(localVideoRef, stream);
            stream.getTracks().forEach(track => pConnection.addTrack(track, stream));
        });
        // navigator.getUserMedia(
        //     {video: true, audio: true},
        //     stream => {
        //         console.log('on-stream');
        //         setVideoStream(localVideoRef, stream);
        //
        //         // peerConnection.
        //
        //         // @ts-ignore
        //         // peerConnection.addStream(stream);
        //
        //         stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
        //     },
        //     error => {
        //         console.warn(error.message);
        //     },
        // );


    };

    return (
        <div>

            <div style={{padding: 10, cursor: 'pointer'}} onClick={() => connectToSocket()}>
                {id}
            </div>

            <Status text={"Is Peer Connected"} value={isConnected} />

            {
                request && (
                    <div>
                        this client request a video chat.
                        <p style={{cursor: 'pointer'}} onClick={() => acceptRequest()}>
                            Accept
                        </p>
                    </div>
                )
            }
            {
                answer && (
                    <div>
                        this client accepted your request.
                        <p style={{cursor: 'pointer'}} onClick={() => startCall()}>
                            Start call
                        </p>
                    </div>
                )
            }
            <div>
                <p>remote-video</p>
                <video autoPlay width={400} ref={remoteVideoRef}/>
            </div>
            <div>
                <p>preview-video</p>
                <video autoPlay width={400} ref={localVideoRef}/>
            </div>

        </div>

    );
};

export default PeerComponent
