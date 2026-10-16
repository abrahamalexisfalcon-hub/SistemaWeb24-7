import api from './client';

export interface SuscripcionPushPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
  usuarioId?: number;
}

export const notificacionesApi = {
  getVapidPublicKey: async (): Promise<string> => {
    try {
      const res = await api.get<{ publicKey: string }>('/notificaciones/public-key');
      return res.data.publicKey;
    } catch {
      return 'BCpAAMs1UM1ZKxugrSSB2_LhAeL3SbgFnCPF2M1RLdfPqXEKg3p7pk-I5WvIefOoEnsRCUCQB5chIO1r08j0iEA';
    }
  },

  registrarSuscripcion: async (payload: SuscripcionPushPayload): Promise<void> => {
    await api.post('/notificaciones/suscripcion-push', payload);
  },
};
