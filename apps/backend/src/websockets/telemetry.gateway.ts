import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../core/supabase.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/telemetry'
})
export class TelemetryGateway {
  @WebSocketServer()
  server!: Server;

  constructor(private supabase: SupabaseService) {}

  handleConnection(client: Socket) {
    client.on('subscribe', (deviceId: string) => {
      client.join(`device-${deviceId}`);
    });
  }

  @SubscribeMessage('get-telemetry')
  async getTelemetry(@MessageBody() data: { deviceId: string; oids?: string[] }) {
    const client = this.supabase.getAdminClient();
    
    const { data: device } = await client
      .from('network_devices')
      .select('*')
      .eq('id', data.deviceId)
      .single();

    if (!device) {
      return { error: 'Device not found' };
    }

    return { telemetry: device.raw_telemetry || {} };
  }

  broadcastTelemetry(deviceId: string, data: any) {
    this.server.to(`device-${deviceId}`).emit('telemetry-update', data);
  }
}