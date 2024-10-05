import React, {useEffect, useRef, useState} from 'react';
import CodeMirror from '@uiw/react-codemirror';
import {java} from '@codemirror/lang-java';
import {syntaxTree} from "@codemirror/language";
import {EditorView} from "@codemirror/view";
import RedCircle from "./RedCircle";

// TODO: I will add comments to this file

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
        setGazePosOnWindow({
            x: gazePosOnScreen.x - windowPosOnScreen.x,
            y: gazePosOnScreen.y - windowPosOnScreen.y
        });

        if (editorRef.current) {
            setLineNum(0);
            setColumnNum(0);
            setToken("");
            setAstChain("");

            const view = editorRef.current.view;
            const position = view.posAtCoords(gazePosOnWindow);

            if (position !== null) {
                const line = view.state.doc.lineAt(position);

                const firstCharCoords = view.coordsAtPos(line.from)
                const lastCharCoords = view.coordsAtPos(line.to);

                if (
                    lastCharCoords &&
                    firstCharCoords &&
                    gazePosOnWindow.y >= firstCharCoords.top && gazePosOnWindow.y <= lastCharCoords.bottom &&
                    gazePosOnWindow.x >= firstCharCoords.left && gazePosOnWindow.x <= lastCharCoords.right
                ) {
                    setLineNum(line.number);
                    setColumnNum(position - line.from + 1);
                    const tree = syntaxTree(view.state);
                    const node = tree.resolveInner(position, 0);
                    if (node) {
                        const bottomNode = getMostBottomToken(node, position);
                        if (bottomNode) {
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
                    readOnly // Can be removed to enable editing
                />
        </div>
);
};

export default CodeMirrorEditor;
