import React from "react";

const Description = () => {
    return (
        <div>
            <h1>Web-based Eye Tracking Code Editor</h1>
            <p><em>By Ningzhi Tang@SaNDwich Lab, October 2024</em></p>
            <p>
                From the data stream of eye gaze or mouse pointer coordinates on the screen, this tool can automatically
                compute the corresponding code semantic information (e.g., line, column, token, and AST chain) in real
                time.
            </p>
            <p>
                It includes features like code highlighting, robust handling of scrolling, and support for code editing,
                eliminating the need for labor-intensive and inaccurate post-processing (e.g., computer vision-based
                methods).
            </p>
        </div>
    );
}

export default Description;