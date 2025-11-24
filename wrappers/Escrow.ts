import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

// Opcodes для операций голосования
export const Opcodes = {
    voteYes: 1,
    voteNo: 2,
};

export type VoteContractConfig = {
    yesVotes?: number;
    noVotes?: number;
};

export function voteContractConfigToCell(config: VoteContractConfig): Cell {
    return beginCell()
        .storeUint(config.yesVotes ?? 0, 32)
        .storeUint(config.noVotes ?? 0, 32)
        .endCell();
}

export class FirstContract implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new FirstContract(address);
    }

    static createFromConfig(config: VoteContractConfig, code: Cell, workchain = 0) {
        const data = voteContractConfigToCell(config);
        const init = { code, data };
        return new FirstContract(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    // Отправить голос "за"
    async sendVoteYes(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.voteYes, 32)
                .endCell(),
        });
    }

    // Отправить голос "против"
    async sendVoteNo(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell()
                .storeUint(Opcodes.voteNo, 32)
                .endCell(),
        });
    }

    // Получить количество голосов "за"
    async getYesVotes(provider: ContractProvider): Promise<number> {
        const result = await provider.get('get_yes_votes', []);
        return result.stack.readNumber();
    }

    // Получить количество голосов "против"
    async getNoVotes(provider: ContractProvider): Promise<number> {
        const result = await provider.get('get_no_votes', []);
        return result.stack.readNumber();
    }

    // Получить оба счетчика одновременно (экономит газ)
    async getVotes(provider: ContractProvider): Promise<{ yes: number; no: number }> {
        const result = await provider.get('get_votes', []);
        return {
            yes: result.stack.readNumber(),
            no: result.stack.readNumber(),
        };
    }
}
