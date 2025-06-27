# ASMR Video Generator 🎬✨

Generate beautiful ASMR videos from simple text prompts using AI! This web app combines OpenAI's language models with Google's Veo3 video generation to create cinematic, relaxing content.

## Features

- 🎯 **Simple Prompt Input** - Enter basic ASMR ideas like "rain sounds" or "cozy fireplace"
- 🧠 **AI Prompt Enhancement** - OpenAI transforms your idea into detailed, cinematic descriptions
- 🎥 **Video Generation** - Veo3 creates high-quality ASMR videos with native audio
- 📊 **Real-time Status** - Watch the generation process with detailed debugging info
- 🎬 **Video Player** - View your generated videos instantly in the browser

## Demo

1. Enter: "Rain sounds in a cozy cabin"
2. AI enhances to: "Close-up shot of raindrops cascading down a frosted cabin window at dusk, with warm golden light filtering through..."
3. Veo3 generates a cinematic ASMR video with natural rain audio

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **AI Enhancement**: OpenAI GPT-3.5-turbo
- **Video Generation**: Google Veo3 via Replicate API
- **Deployment**: Vercel-ready

## Setup

### 1. Clone and Install
```bash
git clone https://github.com/maggie-wiedner/ASMR-videos.git
cd ASMR-videos
npm install
```

### 2. Environment Variables
Create `.env.local` with your API keys:
```env
OPENAI_API_KEY=sk-your-openai-key-here
REPLICATE_API_TOKEN=r8_your-replicate-token-here
```

### 3. Get API Keys

**OpenAI API Key:**
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an account and add billing
3. Generate an API key

**Replicate API Token:**
1. Go to [replicate.com](https://replicate.com)
2. Sign up and go to Account Settings
3. Generate an API token

### 4. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. **Enter Prompt**: Type a simple ASMR idea
2. **Click Generate**: The app will:
   - Enhance your prompt with OpenAI
   - Send to Veo3 for video generation
   - Poll for completion status
3. **Watch Video**: Your generated ASMR video appears with a built-in player

## API Endpoints

- `POST /api/enhance` - Enhance prompts with OpenAI
- `POST /api/generate` - Start video generation with Veo3
- `GET /api/status?id={predictionId}` - Check generation status

## Project Structure

```
app/
├── page.tsx              # Main React component
├── api/
│   ├── enhance/route.ts  # OpenAI prompt enhancement
│   ├── generate/route.ts # Veo3 video generation
│   └── status/route.ts   # Status polling
└── globals.css           # Global styles
```

## Debugging

The app includes comprehensive debugging UI:
- **Original Prompt** - What you entered
- **Enhanced Prompt** - OpenAI's detailed version
- **Generation Status** - Real-time updates from Veo3
- **Error Handling** - Detailed error messages and API responses
- **Debug Info** - Expandable sections with full API responses

## Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

Add your environment variables in the Vercel dashboard.

### Other Platforms
This is a standard Next.js app and can be deployed to any platform that supports Node.js.

## Cost Considerations

- **OpenAI**: ~$0.002 per prompt enhancement
- **Replicate/Veo3**: ~$0.10-0.50 per video (varies by length/quality)

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

- 🐛 [Report Issues](https://github.com/maggie-wiedner/ASMR-videos/issues)
- 💬 [Discussions](https://github.com/maggie-wiedner/ASMR-videos/discussions)

## Roadmap

- [ ] YouTube integration for direct uploads
- [ ] Video history and gallery
- [ ] Custom video parameters (duration, aspect ratio)
- [ ] User accounts and saved prompts
- [ ] Social sharing features
- [ ] Batch video generation