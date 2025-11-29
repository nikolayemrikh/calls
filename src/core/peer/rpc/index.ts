// import { DataConnection } from 'peerjs';
// import { v4 as uuid } from 'uuid';
// import { EPeerEventType } from '../enums';
// import { TPeerEvent } from '../types';

// export const callRpc = async (connection: DataConnection) => {
//   const callId = uuid();
//   const called = new Promise<void>((resolve) => {
//     connection.on('data', (data) => {
//       if (typeof data !== 'object') return;
//       const event = data as TPeerEvent;
//       if (event.type === EPeerEventType.callRpc) {
//         if (event.data.callId !== callId) return;
//         resolve();
//       }
//     });
//   });
//   // in receiver
//   // connection.send({ type: EPeerEventType.callRpc, data: { callId } } satisfies ICallRpcEvent);
//   await called;
// };
