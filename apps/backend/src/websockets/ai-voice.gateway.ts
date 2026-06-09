import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../core/supabase.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/voice'
})
export class AiVoiceGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private supabase: SupabaseService) {}

  handleConnection(client: Socket) {
    console.log(`Voice client connected: ${client.id}`);
  }

  @SubscribeMessage('initiate-call')
  async initiateCall(@MessageBody() data: { phoneNumber: string; userId: string }) {
    const response = await fetch('https://api.vapi.ai/v1/calls', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.VAPI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: data.phoneNumber,
        customerId: data.userId
      })
    });

    const result: any = await response.json();
    return { callId: result.id, status: result.status };
  }

  @SubscribeMessage('get-call-transcript')
  async getTranscript(@MessageBody() data: { callId: string }) {
    const client = this.supabase.getAdminClient();
    const { data: call } = await client
      .from('call_transcripts')
      .select('*')
      .eq('call_id', data.callId)
      .single();

    return call;
  }
}