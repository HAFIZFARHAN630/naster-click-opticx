import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';
import { NetworkService } from '../network-noc/network.service';

export interface VoiceCallRequest {
  userId: string;
  phoneNumber: string;
  issue: string;
}

export interface CallTranscript {
  callId: string;
  userId: string;
  transcript: string;
  summary: string;
  resolved: boolean;
  createdAt: Date;
}

@Injectable()
export class AIVoiceService {
  private supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  constructor(private networkService: NetworkService) {}

  async initiateCall(request: VoiceCallRequest): Promise<{ callId: string; status: string }> {
    const vapiApiKey = process.env.VAPI_API_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;

    const response = await fetch('https://api.vapi.ai/v1/calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${vapiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        assistantId,
        phoneNumber: request.phoneNumber,
        customerId: request.userId,
        metadata: {
          userId: request.userId,
          issue: request.issue
        }
      })
    });

    const result = await response.json();
    return {
      callId: result.id,
      status: result.status
    };
  }

  async handleCallWebhook(payload: {
    callId: string;
    transcript: string;
    summary: string;
    status: string;
  }): Promise<void> {
    await this.supabase.from('call_transcripts').insert({
      call_id: payload.callId,
      transcript: payload.transcript,
      summary: payload.summary,
      resolved: payload.status === 'completed'
    });

    if (payload.summary.toLowerCase().includes('reboot')) {
      await this.triggerNetworkReboot(payload.callId);
    }
  }

  private async triggerNetworkReboot(callId: string): Promise<void> {
    const { data: call } = await this.supabase
      .from('call_transcripts')
      .select('user_id')
      .eq('call_id', callId)
      .single();

    if (call?.user_id) {
      const diagnostics = await this.networkService.diagnoseUserConnection(
        call.user_id,
        '',
        ''
      );

      if (diagnostics.overall_status === 'NOT_CONNECTING') {
        // Trigger reboot via event bus
        const eventBus = new (await import('../core/event-bus/event-bus.service')).EventBusService();
        await eventBus.emit({
          eventId: `network-reboot-${callId}`,
          timestamp: new Date(),
          tenantId: '',
          source: 'ai-voice',
          eventPayload: { userId: call.user_id, action: 'reboot' }
        });
      }
    }
  }

  async getVoiceConfiguration(): Promise<{
    voiceId: string;
    model: string;
    persona: string;
  }> {
    return {
      voiceId: 'zephyr',
      model: 'gpt-4',
      persona: 'Professional, ISP support specialist'
    };
  }
}