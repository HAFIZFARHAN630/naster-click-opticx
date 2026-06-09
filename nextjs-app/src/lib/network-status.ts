import { createClient } from '@supabase/supabase-js';

export interface ActivationStatus {
  status: 'QUEUED' | 'PROCESSING' | 'APPLIED' | 'FAILED';
  message?: string;
  progress?: number;
}

export const usePackageActivation = () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const activatePackage = async (
    packageId: string,
    method: 'WALLET' | 'PAYMENT_GATEWAY',
    paymentId?: string
  ): Promise<ActivationStatus> => {
    const { data: user } = await supabase.auth.getUser();
    
    const response = await fetch('/api/packages/activate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ packageId, method, paymentId })
    });

    const result = await response.json();
    
    return {
      status: 'QUEUED',
      progress: 0
    };
  };

  const subscribeToStatus = (
    activationId: string,
    onUpdate: (status: ActivationStatus) => void
  ) => {
    const channel = supabase
      .channel(`activation:${activationId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'activations',
        filter: `id=eq.${activationId}`
      }, payload => {
        onUpdate({
          status: payload.new.status,
          message: payload.new.message
        });
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  };

  return { activatePackage, subscribeToStatus };
};

export const useNetworkStatus = () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const getNetworkStatus = async (userId: string) => {
    const { data } = await supabase.functions.invoke('get-network-status', {
      body: { userId }
    });
    return data;
  };

  const speedTest = async () => {
    const startTime = Date.now();
    const response = await fetch('https://speed.hetzner.de/100MB.bin');
    const blob = await response.blob();
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    const bitsLoaded = blob.size * 8;
    const speedBps = bitsLoaded / duration;
    const speedMbps = speedBps / 1_000_000;

    return {
      downloadMbps: speedMbps,
      uploadMbps: 0,
      latencyMs: duration * 1000
    };
  };

  return { getNetworkStatus, speedTest };
};