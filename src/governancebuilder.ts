// SPDX-License-Identifier: BSD-3-Clause
/*
 * BSD 3-Clause License
 *
 * Copyright (c) 2022, collective
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

export class GovernanceBuilder {
  static ABI_NAME = 'GovernanceBuilder.json';

  private readonly logger = LoggerFactory.getLogger(module.filename);

  private contractAddress: string;
  private web3: Web3;
  private wallet: Wallet;
  private contractAbi: any[];
  private contract: Contract;
  private gas: number;

  constructor(abiPath: string, contractAddress: string, web3: Web3, wallet: Wallet, gas: number) {
    this.contractAddress = contractAddress;
    this.web3 = web3;
    this.wallet = wallet;
    this.gas = gas;

    const abiFile = pathWithSlash(abiPath) + GovernanceBuilder.ABI_NAME;
    this.logger.info(`Loading ABI: ${abiFile}`);
    this.contractAbi = loadAbi(abiFile);
    this.contract = new web3.eth.Contract(this.contractAbi, this.contractAddress);
    this.logger.info(`Connected to contract ${this.contractAddress}`);
  }

  async name(): Promise<string> {
    const name = await this.contract.methods.name().call();
    return name;
  }

  async aGovernance(): Promise<GovernanceBuilder> {
    this.logger.info('Governance Builder Started');
    const tx = await this.contract.methods.aGovernance().send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(tx);
    return this;
  }

  async withName(name: string): Promise<GovernanceBuilder> {
    this.logger.info(`withName ${name}`);
    const encodedName = this.web3.utils.asciiToHex(name);
    const tx = await this.contract.methods.withName(encodedName).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(tx);
    return this;
  }

  async withUrl(url: string): Promise<GovernanceBuilder> {
    this.logger.info(`withUrl ${url}`);
    const tx = await this.contract.methods.withUrl(url).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(tx);
    return this;
  }

  async withDescription(desc: string): Promise<GovernanceBuilder> {
    this.logger.info(`withDescription ${desc}`);
    const tx = await this.contract.methods.withDescription(desc).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(tx);
    return this;
  }

  async withSupervisor(supervisor: string): Promise<GovernanceBuilder> {
    this.logger.info(`withSupervisor ${supervisor}`);
    const tx = await this.contract.methods.withSupervisor(supervisor).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(tx);
    return this;
  }

  async withVoterClassAddress(voterClass: string): Promise<GovernanceBuilder> {
    this.logger.info(`withVoterClass ${voterClass}`);
    const tx = await this.contract.methods.withVoterClassAddress(voterClass).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(tx);
    return this;
  }

  async withMinimumDuration(duration: number): Promise<GovernanceBuilder> {
    this.logger.info(`withMinimumDuration ${duration}`);
    const tx = await this.contract.methods.withMinimumDuration(duration).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(tx);
    return this;
  }

  async build(): Promise<string> {
    this.logger.info('Building Governance');
    const buildTx = await this.contract.methods.build().send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });
    this.logger.info(buildTx);

    const event: EventData = buildTx.events['GovernanceContractCreated'];
    const governance = event.returnValues['governance'];
    if (governance) {
      return governance;
    }
    throw new Error('Unknown Governance created');
  }
}
