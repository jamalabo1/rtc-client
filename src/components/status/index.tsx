import react from 'react';

type StatusProps = {
    text: string;
    value: boolean;
}
const Status: React.FC<StatusProps> = ({ text, value }) => {
    return (
        <div>
            <p>{text}</p>
            <strong
                style={
                    {
                        color: value ? 'green' : 'red'
                    }
                }
            >
                {value ? 'Yes' : 'No'}
            </strong>
        </div>

    )
}

export default Status;