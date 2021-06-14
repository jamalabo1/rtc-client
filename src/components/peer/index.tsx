import react, { useState, useEffect, useRef } from 'react';



export type ConnectionOffer = RTCSessionDescriptionInit;
export type ConnectionAccepcted = ConnectionOffer;

interface PeerComponentProps {
    id: string;
    requestCallback: (socketId: string, offer: ConnectionOffer) => void;
    acceptCallback: (socketId: string, offer: ConnectionAccepcted) => void;

    request: any;
    answer: any;

}

const { RTCPeerConnection, RTCSessionDescription } = window;


const PeerComponent: React.FC<PeerComponentProps> = ({ id, requestCallback, acceptCallback, request, answer }) => {


    const [peerConnection, setPeerConnection] = useState<RTCPeerConnection>();

    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localVideoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const pConnection = new RTCPeerConnection();

        setPeerConnection(pConnection);
        setListener(pConnection);



    }, []);

    const setVideoStream = (video: react.RefObject<HTMLVideoElement>, stream: MediaStream) => {
        if (video.current) {
            console.log('set-src-object');
            video.current.srcObject = stream;
        }
    }

    const connectToSocket = async () => {
        if (!peerConnection) return;

        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(offer));

        requestCallback(id, offer);
    }

    const acceptReqeuest = async () => {
        if (!peerConnection) return;
        console.log(request);
        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(request)
        );
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(new RTCSessionDescription(answer));

        acceptCallback(id, answer);

        setStream();
    }

    const startCall = async () => {
        if (!peerConnection) return;
        console.log(answer);

        await peerConnection.setRemoteDescription(
            new RTCSessionDescription(answer)
        );

        setStream();

    }


    const setListener = (pConnection = peerConnection) => {
        if (!pConnection) return;
        pConnection.ontrack = function ({ streams: [stream] }) {
            console.log('on-track');
            setVideoStream(remoteVideoRef, stream);
        };
    }

    const setStream = () => {
        if (!peerConnection) return;
        navigator.getUserMedia(
            { video: true, audio: true },
            stream => {
                console.log('on-stream');
                setVideoStream(localVideoRef, stream);

                // peerConnection.

                // @ts-ignore
                // peerConnection.addStream(stream);

                stream.getTracks().forEach(track => peerConnection.addTrack(track, stream));
            },
            error => {
                console.warn(error.message);
            }
        );


    }

    return (
        <div>

            <div style={{ padding: 10, cursor: 'pointer' }} onClick={() => connectToSocket()}>
                {id}
            </div>


            {
                request && (
                    <div>
                        this client request a video chat.
                        <p style={{ cursor: 'pointer' }} onClick={() => acceptReqeuest()}>
                            Accept
                        </p>
                    </div>
                )
            }
            {
                answer && (
                    <div>
                        this client accpected your request.
                        <p style={{ cursor: 'pointer' }} onClick={() => startCall()}>
                            Start call
                        </p>
                    </div>
                )
            }
            <div>
                <p>remote-video</p>
                <video autoPlay width={400} ref={remoteVideoRef} />
            </div>
            <div>
                <p>preview-video</p>
                <video autoPlay width={400} ref={localVideoRef} />
            </div>

        </div>

    )
}

export default PeerComponent;