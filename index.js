'use strict';
const functions = require('firebase-functions');
const {WebhookClient} = require('dialogflow-fulfillment');
const dialogflow = require('dialogflow');

// Enables debugging statements from the dialogflow-fulfillment library.
process.env.DEBUG = 'dialogflow:debug';

// Section 1: Fill in memories according to cities

const cityData = {
 'New York City': {
   memory: [
   {desc: "We went to see a broadway show and went to see Seth Meyer's late night show, got a bark box and donated it to a dog shelter!"},
   {desc: "We went to color museum and took lots of insta worthy photos!"},
   {desc: "We missed bus 157 together and you still have the ticket!"}
    ],
 },
 'San Jose': {
   memory: [
   {desc: "We worked at PayPal together and you held my hand while watching Mamma Mia!"},
   {desc: "We drank lots of boba, from TeaTop, TPTea and Pekoe!"},
   {desc: "You brought me to Mount Umunum and Communications Hill before it was burnt!"},
   {desc: "We talked so much at Apex that the security guard chased us away!"},
   {desc: "I cooked stew and burnt vegetables for you after switching off the lights!"}
   ],
 },
 'Texas': {
   memory: [
   {desc: "We rode electric scooters all around Texas!"},
   {desc: "Ate lots of barbeque! You were spamming the sauce at Terry Black's!"},
   {desc: "You sneezed like a cow because of your pollen allergy!"},
   ],
 },
 'Hawaii': {
   memory: [
   {desc: "We went snorkeling at Ahihi Bay! Saw many big fishes"},
   {desc: "First scuba diving experience! We were so mentally unprepared but went anyway, and Deborah said we were great students! Tho your thingum didn't work after."},
   {desc: "Ate lotsa seafood!"},
   {desc: "We ate a lot of Hawaiian BBQ LOL and afterwards you got sick of it. And also sick of the island and got island fever!"},
   {desc: "We went to the hospital cos you stepped on a nail LOL"},
   {desc: "On the last night, we wanted to have a hot bath but the bathroom ran out of hot water LOL"},
   {desc: "On the last night, we painted half of our painting LOL"},
   ],
},
'Canada': {
   memory: [
   {desc: "You couldn't speak French LOL and didn't wanna head out when I got stuck at the airport in Newark"},
   {desc: "You were obsessed with Canadian macs Serieusement Poulet and I ordered it in French for you"},
   {desc: "Many pretty buildings and old cobblestone paths!"},
   {desc: "Almost ate rabbits at Vieux-Quebec!"},
   {desc: "Spent 8 dollars on a funiculaire aka expensive elevator"},
   {desc: "HOLDER'S!! DRANK GREAT WINE AND HAD GREAT FOOD AND another great activity after ;)"},
   {desc: "Chilled at Tim Hortons all day every day"},
   {desc: "We bought lotsa maple products at the store and you had a business idea on maple boba!"},
   {desc: "Saw super big crab that sells for super cheap!"},
   {desc: "Saw Niagara Falls!! Saw that the Canadian side was so touristy"},
   {desc: "Great Japanese food and The Alley boba with blueberry aftertaste!"},
   {desc: "Airbnb has a candy machine and Alexa!"},
   {desc: "It was cold at Niagara and you were a sniffly boy!"},
   {desc: "Had Tim Hortons for the first time!"},
   {desc: "Had the gallons-litres and conversion rate scare LOL"},
   {desc: "Had Nando's Perry Perry Chicken picnic!"},
   ],
},
'Quebec City': {
   memory: [
   {desc: "You couldn't speak French LOL and didn't wanna head out when I got stuck at the airport in Newark"},
   {desc: "You were obsessed with Canadian macs Serieusement Poulet and I ordered it in French for you"},
   {desc: "Many pretty buildings and old cobblestone paths!"},
   {desc: "Almost ate rabbits at Vieux-Quebec!"},
   {desc: "Spent 8 dollars on a funiculaire aka expensive elevator"},
   ],
},

'Montreal': {
   memory: [
   {desc: "HOLDER'S!! DRANK GREAT WINE AND HAD GREAT FOOD AND another great activity after ;)"},
   {desc: "Chilled at Tim Hortons all day every day"},
   {desc: "We bought lotsa maple products at the store and you had a business idea on maple boba!"},
   {desc: "Saw super big crab that sells for super cheap!"},
   ],
},

'Toronto': {
   memory: [
   {desc: "Saw Niagara Falls!! Saw that the Canadian side was so touristy"},
   {desc: "Great Japanese food and The Alley boba with blueberry aftertaste!"},
   {desc: "Airbnb has a candy machine and Alexa!"},
   {desc: "It was cold at Niagara and you were a sniffly boy!"},
   {desc: "Had Tim Hortons for the first time!"},
   {desc: "Had the gallons-litres and conversion rate scare LOL"},
   {desc: "Had Nando's Perry Perry Chicken picnic!"},
   ],
}
};


exports.dialogflowFirebaseFulfillment =
 functions.https.onRequest((request, response) => {
   const agent = new WebhookClient({request, response});
   console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
   console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

	function giveMemory(agent) {
		const city = agent.parameters['places'];
     	// Look up data for this city from our datastore. In a production
     	// agent, we could make a database or API call to do this.
     	const data = cityData[city];


		const client = new dialogflow.SessionEntityTypesClient();

     	// Combine the session identifier with the name of the EntityType
     	// we want to override, which in this case is 'street'. This is
     	// according to the template in the docs:
     	// https://dialogflow.com/docs/reference/api-v2/rest/v2/projects.agent.sessions.entityTypes#SessionEntityType
		const sessionEntityTypeName = agent.session + '/entityTypes/responses';

		const sessionEntityType = {
       		name: sessionEntityTypeName,
       		entityOverrideMode: 'ENTITY_OVERRIDE_MODE_OVERRIDE',
     	};

		const request = {
       		parent: agent.session,
       		sessionEntityType: sessionEntityType,
     	};
		var index = Math.floor(Math.random() * (data.memory.length - 0)); 
		console.log("memory length is " + data.memory.length);
      	console.log("index is " + index);
     	return client
     	.createSessionEntityType(request)
        .then((responses) => {
        	console.log('Successfully created session entity type:',
        		JSON.stringify(request));
        	agent.add("I love " + city + " tooo. Remember this?");
        	agent.add(data.memory[index].desc);
         })
         .catch((err) => {
           console.error('Error creating session entitytype: ', err);
           agent.add("I'm sorry, I'm having trouble remembering that city.");
           agent.add("Is there a different city you'd like to hear?");
         });
}


	function followUpMore(agent) {
     	const context = agent.context.get('cityname-followup');
     	const cityName = context.parameters ? context.parameters.places : undefined;

     	// If we couldn't find the correct context, log an error and inform the
     	// user. This should not happen if the agent is correctly configured.
     	if (!context || !cityName) {
       		console.error('Expected context or parameter was not present');
       		agent.add("I'm sorry, I forgot which city we're talking about!");
       		agent.add("Would you like me to ask about New York, LA, Chicago, or Houston?");
       		return;
     	}

     	
       	agent.add("Give me another city and I'll give you more memories!");
       	agent.context.delete("cityname-followup");
   }

      // Run the proper function handler based on the matched Dialogflow intent name.
   const intentMap = new Map();
   intentMap.set('Memories-Places', giveMemory);
   intentMap.set('Memories-Places - FollowUp', followUpMore);
   agent.handleRequest(intentMap);
 });
