// SPDX-License-Identifier: BSD-3-Clause
/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2022, Collective.XYZ
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * 3. Neither the name of the copyright holder nor the names of its
 *    contributors may be used to endorse or promote products derived from
 *    this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 * FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 * DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 * SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 * CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 * OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import Web3 from 'web3';
import { Contract, EventData } from 'web3-eth-contract';
import { Wallet } from './wallet';
import { loadAbi, pathWithSlash } from './abi';
import { LoggerFactory } from './logging';

export class CollectiveGovernance {
  private readonly logger = LoggerFactory.getLogger(module.filename);

  static ABI_NAME = 'Governance.json';
  static STRAT_NAME = 'VoteStrategy.json';

  private contractAddress: string;
  private wallet: Wallet;
  private contractAbi: any[];
  private contract: Contract;
  private stratAbi: any[];
  private strategy: Contract;
  private gas: number;

  constructor(abiPath: string, contractAddress: string, web3: Web3, wallet: Wallet, gas: number) {
    this.contractAddress = contractAddress;
    this.wallet = wallet;
    this.gas = gas;

    const abiFile = pathWithSlash(abiPath) + CollectiveGovernance.ABI_NAME;
    this.logger.info(`Loading ABI: ${abiFile}`);
    this.contractAbi = loadAbi(abiFile);
    this.contract = new web3.eth.Contract(this.contractAbi, this.contractAddress);
    this.logger.info(`Connected to contract ${this.contractAddress}`);

    const stratFile = pathWithSlash(abiPath) + CollectiveGovernance.STRAT_NAME;
    this.logger.info(`Loading ABI: ${stratFile}`);
    this.stratAbi = loadAbi(stratFile);
    this.strategy = new web3.eth.Contract(this.stratAbi, this.contractAddress);
  }

  async name(): Promise<string> {
    const name = await this.contract.methods.name().call();
    return name;
  }

  async version(): Promise<number> {
    const version = await this.contract.methods.version().call();
    return version;
  }

  async propose(): Promise<number> {
    this.logger.debug('Propose new vote');
    const proposeTx = await this.contract.methods.propose().send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(proposeTx);
    const event: EventData = proposeTx.events['ProposalCreated'];
    const proposalId = parseInt(event.returnValues['proposalId']);
    if (proposalId) {
      return proposalId;
    }
    throw new Error('Unknown proposal created');
  }

  async attachTransaction(
    proposalId: number,
    target: string,
    value: number,
    signature: string,
    calldata: string,
    etaOfLock: number
  ): Promise<void> {
    this.logger.debug(`attach: ${proposalId}, ${target}, ${value}, ${signature}, ${calldata}, ${etaOfLock}`);
    const attachTx = await this.contract.methods
      .attachTransaction(proposalId, target, value, signature, calldata, etaOfLock)
      .send({
        from: this.wallet.getAddress(),
        gas: this.gas,
      });
    this.logger.info(attachTx);
  }

  async configure(proposalId: number, quorum: number): Promise<void> {
    this.logger.debug('configure vote');
    const configureTx = await this.contract.methods.configure(proposalId, quorum).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(configureTx);
  }

  async isOpen(proposalId: number): Promise<boolean> {
    return await this.strategy.methods.isOpen(proposalId).call();
  }

  async startVote(proposalId: number): Promise<void> {
    this.logger.debug('start vote');
    const openTx = await this.strategy.methods.startVote(proposalId).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(openTx);
  }

  async endVote(proposalId: number): Promise<void> {
    this.logger.debug('end vote');
    const endTx = await this.strategy.methods.endVote(proposalId).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(endTx);
  }

  async cancel(proposalId: number): Promise<void> {
    this.logger.debug(`cancel: ${proposalId}`);
    const endTx = await this.strategy.methods.cancel(proposalId).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(endTx);
  }

  async voteFor(proposalId: number): Promise<void> {
    this.logger.debug('vote for');
    const voteTx = await this.strategy.methods.voteFor(proposalId).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(voteTx);
  }

  async voteForWithTokenId(proposalId: number, tokenId: number): Promise<void> {
    this.logger.debug(`vote for with token: ${tokenId}`);
    const voteTx = await this.strategy.methods.voteFor(proposalId, tokenId).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(voteTx);
  }

  async voteAgainst(proposalId: number): Promise<void> {
    this.logger.debug('vote against');
    const voteTx = await this.strategy.methods.voteAgainst(proposalId).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(voteTx);
  }

  async voteAgainstWithTokenId(proposalId: number, tokenId: number): Promise<void> {
    this.logger.debug(`vote against with token: ${tokenId}`);
    const voteTx = await this.strategy.methods.voteAgainstWithTokenId(proposalId, tokenId).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(voteTx);
  }

  async abstainFromVote(proposalId: number): Promise<void> {
    this.logger.debug('abstain');
    const voteTx = await this.strategy.methods.abstainFromVote(proposalId).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(voteTx);
  }

  async abstainWithTokenId(proposalId: number, tokenId: number): Promise<void> {
    this.logger.debug(`abstain for ${tokenId}`);
    const voteTx = await this.strategy.methods.abstainWithTokenId(proposalId, tokenId).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(voteTx);
  }

  async voteSucceeded(proposalId: number): Promise<boolean> {
    return await this.strategy.methods.getVoteSucceeded(proposalId).call();
  }

  async getStorageAddress(): Promise<string> {
    return await this.contract.methods.getStorageAddress().call();
  }
}
