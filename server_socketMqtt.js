//--------- sockets and mqtt, real time data in browser and mongodb-------------

//----------enabling sockets at port 5000 with broker connectivity--------------

var sys = require('util');
var net = require('net');
var mqtt = require('mqtt');
 
var io  = require('socket.io').listen(5000);
 var client = mqtt.connect('mqtt://IP:PORT');

console.log("connected to AdnateIot broker");


io.sockets.on('connect', function (socket) {
    
    // socket connection indicates what mqtt topic to subscribe to in data.topic
    
    console.log("CLIENT's page refereshed");          
         
    socket.on('subscribe', function (data) 
              {
            
        console.log('Subscribing to '+data.topic);
         
         if(data.topic==undefined)
             {
                 
                 console.log("opps bad request from subscriber");
                
             }
       else
       {
           
        client.subscribe(data.topic);
         }   
    });
    
    //-----what payload with topic to be published at mqtt broker----------------
    
         socket.on('publish', function (data) {
             
              console.log('Publishing to '+data.topic);
             
             if(data.topic==undefined)
             {
                 
                 console.log("opps bad request from publisher");
                
             }
                 else 
                     {
                         
                         client.publish(data.topic,data.payload,data.qos);
                     }
    });
    

    
    socket.on('destroy', function(){
                 console.log(' Client has been disconnected');
                        socket.disconnect(true);
    });
    
         
});

//io.sockets.on('disconnect', function (socket) {
    //client.disconnect();
 
      
//});


//---------mongo coonectivity and publishing payload at browser --------

var Topic = '#';
var mongodb=require('mongodb');  
var mqtt=require('mqtt')  
var mongodb=require('mongodb');  
var mongodbClient=mongodb.MongoClient;  
var mongodbUrl='mongodb://IP:PORT/IOT?authSource=admin'  //AdnateIotSignup DB name
var deviceRoot="#"  
var collection,client; 
var BrokerUrl = 'mqtt://IP:PORT';
mongodbClient.connect(mongodbUrl,setupCollection);


function setupCollection(err,db) {  
  if(err) throw err;
  else{
	  console.log('Conected to ', mongodbUrl)
	collection=db.collection("mos");//mos collection name
  }
  
}

var client  = mqtt.connect(BrokerUrl);
client.subscribe(deviceRoot+"+")
client.on('connect', mqtt_connect);
client.on('reconnect', mqtt_reconnect);
client.on('error', mqtt_error);
client.on('message', mqtt_messsageReceived);
client.on('close', mqtt_close);

function mqtt_connect() {
    console.log("Connecting MQTT");
    client.subscribe(Topic, mqtt_subscribe);
};

function mqtt_subscribe(err, granted) {
    console.log("Subscribed to " + Topic + " for all userMongo");
    if (err) {console.log(err);}
};

function mqtt_reconnect(err) {
    console.log("Reconnect MQTT");
    //if (err) {console.log(err);}
	client  = mqtt.connect(BrokerUrl);
};

function mqtt_error(err) {
    //console.log("Error!");
	if (err) {console.log(err);}
};

function after_publish() {
	//do nothing
};

//receive a message from MQTT broker
function mqtt_messsageReceived(topic, payload, packet) {
    
    //-----listen to comming payload from broker------
     console.log(topic+'-->'+payload);
    io.sockets.emit('mqtt',{'topic':String(topic),
         'payload':String(payload)});
    
    
    //---PUSHING DATA to CHARTS------------------
    console.log(payload);
    io.sockets.emit('data',{'payload':String(payload)});
    console.log("payload push to charts");
    
    
    
    
    
	console.log('mqtt_messsageReceived :',topic,payload);
    
      
    
	var message_str = payload.toString(); //convert byte array to string
   
    console.log("message to string",message_str);
   
   
	message_str = message_str.replace(/\n$/, ''); //remove new line
    message_str = message_str.toString().split("|");
    console.log("message to params array",message_str);
   
	//payload syntax: clientID,topic,message
	if (message_str.length == 0) {
		console.log("Invalid payload");
		} else {
		insertEvent(topic , message_str , packet);
	}
};


function insertEvent(topic,message_str, packet) {  
  var key=topic.replace(deviceRoot,'');
  collection.insert({
												
												'Channel' : topic,												
												'message' : message_str[0], 
												'packet' : packet,
												'when':new  Date(),
											  },
		  function(err,docs) {
		    if(err)
				 console.log("Insert fail");
				else
					console.log('success inserted', docs)
			} // Improve error handling

		  )
	}
	


function mqtt_close() {
	//console.log(" MQTT");
};
