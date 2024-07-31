import { promises as fs } from 'fs';

import 'dotenv/config';
import { VertexAI, GenerateContentRequest, SafetySetting, ModelParams } from '@google-cloud/vertexai';


const PROJECT_ID = 'meme-detector'; // Replace with your Google Cloud project ID
const LOCATION = 'us-central1'; // Replace with your preferred location


const vertexAI = new VertexAI({
  project: PROJECT_ID,
  location: LOCATION,
  googleAuthOptions: {
    projectId: PROJECT_ID,
    universeDomain: 'googleapis.com',
    keyFile: '/Users/pperez/Downloads/meme-detector-0807d31937e1.json',
  }
});

const model = 'gemini-1.0-pro-vision-001';

const generationConfig = {
  'maxOutputTokens': 2048,
  'temperature': 0.4,
  'topP': 0.4,
  'topK': 32,
};
const safetySettings = [
  {
    'category': 'HARM_CATEGORY_HATE_SPEECH',
    'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    'category': 'HARM_CATEGORY_DANGEROUS_CONTENT',
    'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    'category': 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
    'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
  },
  {
    'category': 'HARM_CATEGORY_HARASSMENT',
    'threshold': 'BLOCK_MEDIUM_AND_ABOVE'
  }
] as SafetySetting[];

async function detectPhoto(path: string) {


  const generativeModel = vertexAI.preview.getGenerativeModel({
    model: model,
    generationConfig,
    safetySettings,
  } as ModelParams);

  const prompt = "Look at the following photo and tell me if it's a photo, a screenshot, or a meme. Answer with just one word.";
  const imageData = await fs.readFile(path);


  const request: GenerateContentRequest = {
    generationConfig,
    contents: [
      {
        parts: [
          {

            text: prompt,


          }, {
            inlineData: {
              mimeType: 'image/jpeg',
              data: imageData.toString('base64'),
            }
          }],
        role: 'user'
      },

    ],
  };



  const streamingResp = await generativeModel.generateContentStream(request);

  for await (const item of streamingResp.stream) {
    process.stdout.write('stream chunk: ' + JSON.stringify(item) + '\n');
  }

  process.stdout.write('aggregated response: ' + JSON.stringify(await streamingResp.response));

}

async function run() {
  const root = '/Users/pperez/Downloads/Photos-001 (1)/';
  let files = await fs.readdir(root);
  for (const file of files) {
    console.log(`Check to see if ${file} is a photo, meme, or screenshot...`);
    let result = await detectPhoto(root + file);
    console.log(result);
  }
}

run()
