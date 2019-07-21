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
   {desc: "We went to see a broadway show and went to see Seth Meyer's late night show,
     got a bark box and donated it to a dog shelter!"},
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
   {desc: "I cooked stew and burnt vegetables for you!"}
   ],
 }
 'Texas': {
   trivia: {
     question: `Which fashionable street did Chicago's first mayor live on?',
     answer: 'Rush Street',
   },
   streets: [
     {value: 'Rush Street', synonyms: ['Rush Street', 'Rush']},
     {value: 'Lake Shore Drive', synonyms: ['Lake Shore Drive']},
     {value: 'Broadway', synonyms: ['Broadway']},
   ],
 },
 'Hawaii': {
   trivia: {
     question: 'What is the main street at the University of Houston?',
     answer: 'Cullen Boulevard',
   },
   streets: [
     {value: 'Cullen Boulevard', synonyms: ['Cullen Boulevard', 'Cullen']},
     {value: 'Kirby Drive', synonyms: ['Kirby Drive', 'Kirby']},
     {value: 'Westheimer Road', synonyms: ['Westheimer Road', 'Westheimer']},
   ],
 },
};


exports.dialogflowFirebaseFulfillment =
 functions.https.onRequest((request, response) => {
   const agent = new WebhookClient({request, response});
   console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
   console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

function giveMemory(agent) {
     const city = agent.parameters['city'];

     // Look up data for this city from our datastore. In a production
     // agent, we could make a database or API call to do this.
     const data = cityData[city];


	const client = new dialogflow.SessionEntityTypesClient();

     // Combine the session identifier with the name of the EntityType
     // we want to override, which in this case is 'street'. This is
     // according to the template in the docs:
     // https://dialogflow.com/docs/reference/api-v2/rest/v2/projects.agent.sessions.entityTypes#SessionEntityType
	const sessionEntityTypeName = agent.session + '/entityTypes/street';

	const sessionEntityType = {
       name: sessionEntityTypeName,
       entityOverrideMode: 'ENTITY_OVERRIDE_MODE_OVERRIDE',
       entities: data.streets,
     };

	const request = {
       parent: agent.session,
       sessionEntityType: sessionEntityType,
     };

     return client
         .createSessionEntityType(request)
         .then((responses) => {
           console.log('Successfully created session entity type:',
               JSON.stringify(request));
           agent.add("I love ${city} tooo. Remember this day?");
           agent.add(data.memory.specific);
         })
         .catch((err) => {
           console.error('Error creating session entitytype: ', err);
           agent.add("I'm sorry, I'm having trouble remembering that city.");
           agent.add("Is there a different city you'd like to be quizzed on?");
         });
}


function checkTriviaAnswer(agent) {
     const context = agent.context.get('cityname-followup');
     const cityName = context.parameters ? context.parameters.city : undefined;

     // If we couldn't find the correct context, log an error and inform the
     // user. This should not happen if the agent is correctly configured.
     if (!context || !cityName) {
       console.error('Expected context or parameter was not present');
       agent.add("I'm sorry, I forgot which city we're talking about!");
       agent.add("Would you like me to ask about New York, LA, Chicago, or Houston?");
       return;
     }

     const streetName = agent.parameters['street'];

     // Look up data for this city from our datastore. In a production
     // agent, we could make a database or API call to do this.
     const data = cityData[cityName];

     if (data.trivia.answer === streetName) {
       agent.add(`Nice work! You got the answer right. You're truly an expert on ${cityName}.`);
       agent.add(`Give me another city and I'll ask you more questions.`);
       agent.context.delete('cityname-followup');
     } else {
       agent.add(`Oops, ${streetName} isn't the right street! Try another street name...`);
     }
   }
