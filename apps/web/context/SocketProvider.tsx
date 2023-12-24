//We gonna use client and not a server component
//Frontend for provider

'use client'
import React, { useCallback, useContext, useEffect, useState } from "react";
import {Socket, io} from 'socket.io-client'; //to create a connection with the server

interface SocketProviderProps{
    children?: React.ReactNode; //created a prop to access children which is optional(?) in nature
}

interface ISocketContext{
    sendMessage: (msg: string) => any; 
    messages: string[];
}

const SocketContext = React.createContext<ISocketContext | null>(null);

//custom hook
export const useSocket = () =>{
    const state = useContext(SocketContext);

    if (!state) throw new Error(`state is undefined`);
    return state;
}

export const SocketProvider: React.FC<SocketProviderProps> = ({children}) =>{//Destructuring children

    const [socket, setSocket] = useState<Socket>()
    const [messages, setMessages] = useState<string[]>([]);


    const sendMessage: ISocketContext["sendMessage"] = useCallback((msg)=>{
        console.log("Send Message", msg);
        if(socket){
            socket.emit('event:message', {message: msg});
        }
    }, [socket]//<-dependencies. We made one side communication successfully i.e. client can now emit messages to our socket server.
    );

    //handling message in frontend. 
    const onMessageRec = useCallback((msg: string)=>{
        console.log('From server message received', msg);
        const {message} = JSON.parse(msg) as {message: string};
        setMessages((prev) =>[...prev, message]);
    },[]);

    useEffect(()=>{ //component lifecycle
        const _socket = io("http://localhost:8000"); //will establish the connection
        _socket.on('message', onMessageRec); //when client receives a new message
        setSocket(_socket)

        //cleaner fn. used when we want to rerender to clean out.
        return ()=>{
            _socket.disconnect();
            _socket.off('message', onMessageRec);
            setSocket(undefined);
        };
    }, []);

    return (
        <SocketContext.Provider value={{sendMessage, messages}}>
            {children} 
        </SocketContext.Provider>
    );
};