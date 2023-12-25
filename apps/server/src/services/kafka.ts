import { Kafka, Producer } from "kafkajs";
import fs from 'fs';
import path from 'path';
import prismaClient from "./prisma";

//Broker
const kafka = new Kafka({
    brokers:["kafka-351308d8-socket-chat.a.aivencloud.com:25979"],
    ssl:{
        ca:[fs.readFileSync(path.resolve('./ca.pem'), 'utf-8')], //to read pem file
    },
    sasl:{
        username: "avnadmin",
        password: "your_password",
        mechanism: "plain",
    }
});

//Producer
let producer: null | Producer = null;

//This block will make us a producer
export async function createProducer(){
    if(producer) return producer; //to check whether we have an existing producer or not

    //local 
    const _producer = kafka.producer();// If not, we will create a local producer
    await _producer.connect();
    producer = _producer;
    return producer;
};

export async function produceMessage(message:string){
    const producer = await createProducer();//GET producer

    //Send messages to producer
    await producer.send({
        messages: [{ key: `message-${Date.now()}`, value: message }],
        topic: "MESSAGES",
    });
    return true;
}


//consumer
export async function startMessageConsumer(){
    console.log('Consumer is running')
    const consumer = kafka.consumer({groupId:"default"});
    await consumer.connect();
    await consumer.subscribe({topic:"MESSAGES", fromBeginning:true});

    await consumer.run({
        autoCommit:true,
        eachMessage:async({message, pause})=>{
            if(!message.value) return;
            console.log(`New Message Received in Consumer`);
            try{
                //this will store messages to our postgresql DB
                await prismaClient.message.create({
                    data:{
                        text: message.value?.toString(),
                    },
                });
                //if it catches any error, consumer will pause itself and resume itself after some interval.
            }catch(err){
                console.log("something is wrong")
                pause()
                setTimeout(()=>{
                    consumer.resume([{topic:"MESSAGES"}]);
                }, 60000);
            }
        }
    })
}
export default kafka;