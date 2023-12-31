import {Server} from 'socket.io';
import Redis from 'ioredis';
import { produceMessage } from './kafka';

const pub = new Redis({
    host:'redis-28bb944d-socket-chat.a.aivencloud.com',
    port:25966,
    username:'default',
    password:'AVNS_7B7sGgfnstz0fiRd8dl'

});
const sub = new Redis({
    host:'redis-28bb944d-socket-chat.a.aivencloud.com',
    port:25966,
    username:'default',
    password:'AVNS_7B7sGgfnstz0fiRd8dl'
});

class SocketService{
    private _io: Server; //instance variable for the class 
    constructor(){
        console.log("init socket service...");
        this._io = new Server({
            cors: {
                allowedHeaders: ["*"],
                origin: '*',
            },
        });
        sub.subscribe('MESSAGES');
    }

    //Initializing event listeners 
    public initListeners(){
        const io = this.io;
        console.log("Init socket listeners");

        io.on("connect", (socket)=>{ //we are handling new client connections
            console.log(`new socket connected`, socket.id);

            socket.on('event:message', async({message}: {message: string})=>{
                console.log(`New message received`, message);//post getting the message, transfer it to redis server

            await pub.publish('MESSAGES', JSON.stringify({message})); //params (ChannelName, message(format)) as per docs. This will publish messages from socket servers to redis server.
            
        });
        });
//To share messages to all the clients from redis server
//To spin new servers up simultaneously, open CMD and write export PORT=8001 && npm start 
        sub.on('message', async (channel, message)=>{
            if(channel === 'MESSAGES'){
                console.log("new message from redis server", message);
                io.emit('message', message);
                await produceMessage(message);
                console.log("Nessage produced to kafka broker");
            }
        });
    }

    //Getter Fn
    get io(){
        return this._io;
    }
}
 
export default SocketService;