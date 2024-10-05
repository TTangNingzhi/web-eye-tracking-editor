/**
 * RedCircle component is a simple red circle that follows the user's gaze position on the screen.
 * @param gazePosOnWindow The gaze position on the window.
 * @returns {JSX.Element} A red circle that follows the user's gaze position.
 * @constructor
 */
const RedCircle = ({gazePosOnWindow}) => {
    const circleStyle = {
        position: 'absolute',
        top: `${gazePosOnWindow.y + window.scrollY - 10}px`,
        left: `${gazePosOnWindow.x + window.scrollX - 10}px`,
        width: '20px',
        height: '20px',
        backgroundColor: 'rgba(255, 0, 0, 0.5)',
        borderRadius: '50%',
        pointerEvents: 'none',
        zIndex: 1000,
    };

    return (
        <div style={circleStyle}></div>
    );
}

export default RedCircle;