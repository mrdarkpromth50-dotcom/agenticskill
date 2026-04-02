import { Request, Response } from 'express';
import { FallbackChain } from './fallback-chain';
import { LLMRequest, ChatRequest, LLMResponse, ChatResponse } from './types';
import axios from 'axios';

export class ProxyHandler {
  private fallbackChain: FallbackChain;
  private translationLayerUrl: string | undefined;

  constructor(fallbackChain: FallbackChain) {
    this.fallbackChain = fallbackChain;
    this.translationLayerUrl = process.env.TRANSLATION_LAYER_URL;
  }

  private async translateText(text: string, from: string, to: string): Promise<string> {
    if (!this.translationLayerUrl) {
      console.warn('Translation Layer URL not configured. Skipping translation.');
      return text;
    }
    try {
      const response = await axios.post(`${this.translationLayerUrl}/translate`, {
        text,
        from,
        to,
      });
      return response.data.translatedText;
    } catch (error) {
      console.error('Error calling Translation Layer:', error);
      return text; // Return original text on error
    }
  }

  public async handleGenerate(req: Request, res: Response): Promise<void> {
    try {
      let { prompt, model, maxTokens, temperature, stream, translateToEnglish } = req.body as LLMRequest & { translateToEnglish?: boolean };

      if (!prompt) {
        res.status(400).send({ error: 'Missing required field: prompt' });
        return;
      }

      // Optional: Translate prompt to English if requested
      if (translateToEnglish) {
        prompt = await this.translateText(prompt, 'th', 'en');
        console.log('Translated prompt to English:', prompt);
      }

      const llmRequest: LLMRequest = {
        prompt,
        model,
        maxTokens,
        temperature,
        stream,
      };

      const response = await this.fallbackChain.execute(llmRequest, false);
      res.status(200).send(response);
    } catch (error) {
      console.error('Error in handleGenerate:', error);
      res.status(500).send({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }

  public async handleChat(req: Request, res: Response): Promise<void> {
    try {
      let { messages, model, maxTokens, temperature, stream, translateToEnglish } = req.body as ChatRequest & { translateToEnglish?: boolean };

      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        res.status(400).send({ error: 'Missing required field: messages' });
        return;
      }

      // Optional: Translate user messages to English if requested
      if (translateToEnglish) {
        for (const message of messages) {
          if (message.role === 'user') {
            message.content = await this.translateText(message.content, 'th', 'en');
          }
        }
        console.log('Translated chat messages to English:', messages);
      }

      const chatRequest: ChatRequest = {
        messages,
        model,
        maxTokens,
        temperature,
        stream,
      };

      const response = await this.fallbackChain.execute(chatRequest, true);
      res.status(200).send(response);
    } catch (error) {
      console.error('Error in handleChat:', error);
      res.status(500).send({ error: error instanceof Error ? error.message : 'Internal server error' });
    }
  }
}
