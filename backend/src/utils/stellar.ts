import {
  Keypair,
  SorobanRpc,
  TransactionBuilder,
  Networks,
  nativeToScVal,
  scValToNative,
  xdr,
  Contract,
} from '@stellar/stellar-sdk';

export class StellarClient {
  private server: SorobanRpc.Server;
  private networkPassphrase: string;
  private adminKeypair: Keypair | null = null;

  constructor() {
    this.server = new SorobanRpc.Server(
      process.env.STELLAR_RPC_URL || 'https://soroban-testnet.stellar.org',
    );
    this.networkPassphrase =
      process.env.STELLAR_NETWORK_PASSPHRASE ||
      Networks.TESTNET;

    if (process.env.STELLAR_ADMIN_SECRET_KEY) {
      this.adminKeypair = Keypair.fromSecret(
        process.env.STELLAR_ADMIN_SECRET_KEY,
      );
    }
  }

  getServer(): SorobanRpc.Server {
    return this.server;
  }

  getNetworkPassphrase(): string {
    return this.networkPassphrase;
  }

  getAdminPublicKey(): string | null {
    return this.adminKeypair?.publicKey() ?? null;
  }

  async getAccount(address: string) {
    return this.server.getAccount(address);
  }

  async simulateContractCall(
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    source?: string,
  ): Promise<SorobanRpc.Api.SimulateTransactionResponse> {
    const pubKey = source ?? this.getAdminPublicKey();
    if (!pubKey) {
      throw new Error('No source account available');
    }
    const sourceAccount = await this.getAccount(pubKey);

    const contract = new Contract(contractId);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    return this.server.simulateTransaction(tx);
  }

  async sendTransaction(
    contractId: string,
    method: string,
    args: xdr.ScVal[],
    secretKey?: string,
  ) {
    const keypair = secretKey
      ? Keypair.fromSecret(secretKey)
      : this.adminKeypair;

    if (!keypair) {
      throw new Error('No secret key available');
    }

    const sourceAccount = await this.getAccount(keypair.publicKey());
    const contract = new Contract(contractId);

    const tx = new TransactionBuilder(sourceAccount, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(contract.call(method, ...args))
      .setTimeout(30)
      .build();

    const simulated = await this.server.simulateTransaction(tx);
    if (!simulated) {
      throw new Error('Simulation failed');
    }

    const preparedTx = this.prepareTransaction(tx, simulated);
    preparedTx.sign(keypair);

    const result = await this.server.sendTransaction(preparedTx);

    if (result.status === 'PENDING' || result.status === 'DUPLICATE') {
      return this.pollTransaction(result.hash);
    }

    throw new Error(`Transaction failed: ${result.errorResult?.result().switch()}`);
  }

  private prepareTransaction(
    raw: Awaited<ReturnType<typeof TransactionBuilder.prototype.build>>,
    simulation: SorobanRpc.Api.SimulateTransactionResponse,
  ) {
    return SorobanRpc.assembleTransaction(raw, simulation).build();
  }

  private async pollTransaction(
    hash: string,
    maxAttempts = 30,
  ): Promise<SorobanRpc.Api.GetTransactionResponse> {
    for (let i = 0; i < maxAttempts; i++) {
      const result = await this.server.getTransaction(hash);
      if (result.status !== 'NOT_FOUND') {
        return result;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error('Transaction timeout');
  }

  createContractId(_wasmHash: string, _salt?: string): string {
    const keypair = Keypair.random();
    return keypair.publicKey();
  }

  toScVal(value: unknown): xdr.ScVal {
    return nativeToScVal(value);
  }

  fromScVal(value: xdr.ScVal): unknown {
    return scValToNative(value);
  }
}

export const stellarClient = new StellarClient();