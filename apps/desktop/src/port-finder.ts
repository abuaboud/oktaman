import net from 'net';

export function findFreePort(preferred: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.listen(preferred, '127.0.0.1', () => {
      const addr = server.address() as net.AddressInfo;
      server.close(() => resolve(addr.port));
    });

    server.on('error', () => {
      // Preferred port is taken, let OS assign a free one
      const fallback = net.createServer();
      fallback.listen(0, '127.0.0.1', () => {
        const addr = fallback.address() as net.AddressInfo;
        fallback.close(() => resolve(addr.port));
      });
      fallback.on('error', reject);
    });
  });
}
