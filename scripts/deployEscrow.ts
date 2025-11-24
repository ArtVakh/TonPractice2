import { toNano } from '@ton/core';
import { FirstContract } from '../wrappers/FirstContract';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const voteContract = provider.open(
        FirstContract.createFromConfig({}, await compile('FirstContract'))
    );

    await voteContract.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(voteContract.address);

    console.log('Vote contract deployed at:', voteContract.address);

    // Демонстрация работы
    console.log('\n--- Initial state ---');
    const initialVotes = await voteContract.getVotes();
    console.log(`Yes votes: ${initialVotes.yes}`);
    console.log(`No votes: ${initialVotes.no}`);

    // Отправка тестового голоса "за"
    console.log('\n--- Sending vote YES ---');
    await voteContract.sendVoteYes(provider.sender(), toNano('0.01'));

    const votesAfterYes = await voteContract.getVotes();
    console.log(`Yes votes: ${votesAfterYes.yes}`);
    console.log(`No votes: ${votesAfterYes.no}`);
}
