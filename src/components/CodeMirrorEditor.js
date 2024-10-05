import React, {useEffect, useRef, useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {java} from '@codemirror/lang-java';
import {syntaxTree} from "@codemirror/language";
import {EditorView} from "@codemirror/view";
import RedCircle from "./RedCircle";

/**
 * Get the most bottom token node in the given position from a middle layer node in the syntax tree.
 * @param node a node in the syntax tree, most likely the middle layer node instead of the most bottom token
 * @param position the position of current gaze in the editor
 * @returns {*|{firstChild}|null} the most bottom token node in the given position
 */
const getMostBottomToken = (node, position) => {
    let currentNode = node;
    while (currentNode.firstChild) {
        currentNode = currentNode.childBefore(position + 1) || currentNode;
    }
    return currentNode.to >= position ? currentNode : null;
};

const CodeMirrorEditor = ({code, gazePosOnScreen}) => {

    const [windowPosOnScreen, setWindowPosOnScreen] = useState({x: 0, y: 0});
    const [gazePosOnWindow, setGazePosOnWindow] = useState({x: 0, y: 0});

    // Some semantic information we want to interpret from raw gaze data, e.g., line, column, token, AST chain
    const [lineNum, setLineNum] = useState(0);
    const [columnNum, setColumnNum] = useState(0);
    const [token, setToken] = useState("");
    const [astChain, setAstChain] = useState("");

    const editorRef = useRef(null);

    // Calculate the position of the top-left corner of the web page on the screen using the mouse move event.
    // It is accurate enough but relying on user's mouse movement into the browser window.
    // This is a workaround because, to the best of my knowledge, there is no direct way to get this information.
    // I suspect the relative position of web page is privacy- and security-sensitive.
    // However, although I haven't found a way, some functions of window object may help,
    // e.g., screenX/Y, outerWidth/Height, innerWidth/Height, visualViewport. Future developers can explore more.
    useEffect(() => {
        const handleMouseMove = (event) => {
            setWindowPosOnScreen({
                x: event.screenX - event.clientX,
                y: event.screenY - event.clientY
            });
        };
        window.addEventListener('mousemove', handleMouseMove);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
        };
    }, []);

    useEffect(() => {
        // Calculate the gaze position on the window by subtracting the window position on the screen.
        setGazePosOnWindow({
            x: gazePosOnScreen.x - windowPosOnScreen.x,
            y: gazePosOnScreen.y - windowPosOnScreen.y
        });

        if (editorRef.current) {
            // Reset the semantic information
            setLineNum(0);
            setColumnNum(0);
            setToken("");
            setAstChain("");

            const view = editorRef.current.view;

            // Convert the gaze coordinates on the window to the position in the editor.
            // Note that the position returned by the API is actually where the CURSOR would be located if you clicked at that point.
            // For example, if you click on the blank space after the last character of a line,
            // the position returned will be the location of the last character, not the blank space!
            // Therefore, if we use it directly, we may get the wrong line and column numbers.
            // To resolve this, we need to check if the gaze position is within the range of actual characters in the line.
            const position = view.posAtCoords(gazePosOnWindow);

            if (position !== null) {
                const line = view.state.doc.lineAt(position);

                // Get the coordinates of the first and last characters of the line.
                const firstCharCoords = view.coordsAtPos(line.from)
                const lastCharCoords = view.coordsAtPos(line.to);

                // Check if the gaze position is within the range of the characters within that line.
                if (
                    lastCharCoords &&
                    firstCharCoords &&
                    gazePosOnWindow.y >= firstCharCoords.top && gazePosOnWindow.y <= lastCharCoords.bottom &&
                    gazePosOnWindow.x >= firstCharCoords.left && gazePosOnWindow.x <= lastCharCoords.right
                ) {
                    setLineNum(line.number);
                    setColumnNum(position - line.from + 1);
                    const tree = syntaxTree(view.state);
                    // Get the AST node at the given position. However, it is not the most bottom token, could be a middle layer node.
                    const node = tree.resolveInner(position, 0);
                    if (node) {
                        // Get the most bottom token node in the given position from a middle layer node in the syntax tree.
                        const bottomNode = getMostBottomToken(node, position);
                        if (bottomNode) {
                            // Get the token and two parent nodes' type names as the AST chain.
                            const parent1 = bottomNode.parent;
                            const parent2 = parent1 ? parent1.parent : null;
                            setToken(view.state.sliceDoc(bottomNode.from, bottomNode.to));
                            setAstChain(`${bottomNode.type.name} -> ${parent1 ? parent1.type.name : ""} -> ${parent2 ? parent2.type.name : ""}`);
                        }
                    }
                }
            }
        }
    }, [gazePosOnScreen, windowPosOnScreen, gazePosOnWindow]);

    const myTheme = EditorView.theme({
        "&": {
            fontSize: "16px"
        }
    });

    return (
        <div>
            <RedCircle gazePosOnWindow={gazePosOnWindow}/>
            <ul>
                <li>Gaze (mouse) position on screen: X: {gazePosOnScreen.x}, Y: {gazePosOnScreen.y}</li>
                <li>Gaze (mouse) position on window: X: {gazePosOnWindow.x}, Y: {gazePosOnWindow.y}</li>
                <li>Gaze (mouse) is over line {lineNum}, column {columnNum}</li>
                <ul>
                    <li>Token: {token}</li>
                    <li>AST chain: {astChain}</li>
                </ul>
            </ul>
            <CodeMirror
                value={code}
                extensions={[java(), myTheme]} // Can be extended with more languages
                height="500px"
                onCreateEditor={(view) => {
                    editorRef.current = {view};
                }}
                // readOnly // Can be added to disable editing
            />
        </div>
    );
};

export default CodeMirrorEditor;
