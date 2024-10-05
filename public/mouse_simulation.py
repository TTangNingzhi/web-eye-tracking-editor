# requirements: pip install pyautogui websockets
# a simple websocket server that sends the mouse position to the client
import pyautogui
import asyncio
import websockets
import json


async def get_mouse_position(websocket, frequency=60):
    screen_width, screen_height = pyautogui.size()
    try:
        while True:
            x, y = pyautogui.position()
            scaled_x, scaled_y = x / screen_width, y / screen_height
            position = {"x": scaled_x, "y": scaled_y}
            await websocket.send(json.dumps(position))
            await asyncio.sleep(1 / frequency)
    except websockets.ConnectionClosed:
        print("Connection closed")


async def main():
    async with websockets.serve(get_mouse_position, "localhost", 8765):
        await asyncio.Future()


if __name__ == "__main__":
    asyncio.run(main())
