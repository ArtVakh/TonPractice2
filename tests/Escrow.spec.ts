import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { FirstContract } from '../wrappers/FirstContract';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('VoteContract', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('FirstContract');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let voter1: SandboxContract<TreasuryContract>;
    let voter2: SandboxContract<TreasuryContract>;
    let voteContract: SandboxContract<FirstContract>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        // Создаем контракт с начальными значениями 0, 0
        voteContract = blockchain.openContract(FirstContract.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');
        voter1 = await blockchain.treasury('voter1');
        voter2 = await blockchain.treasury('voter2');

        const deployResult = await voteContract.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: voteContract.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy with zero votes', async () => {
        const votes = await voteContract.getVotes();
        expect(votes.yes).toEqual(0);
        expect(votes.no).toEqual(0);
    });

    it('should increase yes votes', async () => {
        await voteContract.sendVoteYes(voter1.getSender(), toNano('0.01'));
        
        const yesVotes = await voteContract.getYesVotes();
        expect(yesVotes).toEqual(1);
        
        const noVotes = await voteContract.getNoVotes();
        expect(noVotes).toEqual(0);
    });

    it('should increase no votes', async () => {
        await voteContract.sendVoteNo(voter1.getSender(), toNano('0.01'));
        
        const yesVotes = await voteContract.getYesVotes();
        expect(yesVotes).toEqual(0);
        
        const noVotes = await voteContract.getNoVotes();
        expect(noVotes).toEqual(1);
    });

    it('should handle multiple yes votes', async () => {
        await voteContract.sendVoteYes(voter1.getSender(), toNano('0.01'));
        await voteContract.sendVoteYes(voter2.getSender(), toNano('0.01'));
        await voteContract.sendVoteYes(voter1.getSender(), toNano('0.01'));
        
        const yesVotes = await voteContract.getYesVotes();
        expect(yesVotes).toEqual(3);
    });

    it('should handle multiple no votes', async () => {
        await voteContract.sendVoteNo(voter1.getSender(), toNano('0.01'));
        await voteContract.sendVoteNo(voter2.getSender(), toNano('0.01'));
        
        const noVotes = await voteContract.getNoVotes();
        expect(noVotes).toEqual(2);
    });

    it('should handle mixed votes', async () => {
        await voteContract.sendVoteYes(voter1.getSender(), toNano('0.01'));
        await voteContract.sendVoteNo(voter2.getSender(), toNano('0.01'));
        await voteContract.sendVoteYes(voter1.getSender(), toNano('0.01'));
        await voteContract.sendVoteNo(voter2.getSender(), toNano('0.01'));
        await voteContract.sendVoteYes(deployer.getSender(), toNano('0.01'));
        
        const votes = await voteContract.getVotes();
        expect(votes.yes).toEqual(3);
        expect(votes.no).toEqual(2);
    });

    it('should deploy with custom initial values', async () => {
        const customContract = blockchain.openContract(
            FirstContract.createFromConfig({ yesVotes: 5, noVotes: 3 }, code)
        );
        
        await customContract.sendDeploy(deployer.getSender(), toNano('0.05'));
        
        const votes = await customContract.getVotes();
        expect(votes.yes).toEqual(5);
        expect(votes.no).toEqual(3);
    });

    it('should increment from custom initial values', async () => {
        const customContract = blockchain.openContract(
            FirstContract.createFromConfig({ yesVotes: 10, noVotes: 5 }, code)
        );
        
        await customContract.sendDeploy(deployer.getSender(), toNano('0.05'));
        await customContract.sendVoteYes(voter1.getSender(), toNano('0.01'));
        await customContract.sendVoteNo(voter2.getSender(), toNano('0.01'));
        
        const votes = await customContract.getVotes();
        expect(votes.yes).toEqual(11);
        expect(votes.no).toEqual(6);
    });
});
