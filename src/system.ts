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
import { EventData } from 'web3-eth-contract';
import { Wallet } from './wallet';
import { AbiContract } from './abicontract';

export interface Collective {
  governanceAddress: string;
  storageAddress: string;
  metaAddress: string;
}

export class System extends AbiContract {
  static ABI_NAME = 'Storage.json';

  private readonly wallet: Wallet;
  private readonly gas: number;

  constructor(abiPath: string, contractAddress: string, web3: Web3, wallet: Wallet, gas: number) {
    super(abiPath, System.ABI_NAME, contractAddress, web3);
    this.wallet = wallet;
    this.gas = gas;
  }

  async create(name: string, url: string, description: string, erc721contract: string, quorum: number): Promise<Collective> {
    this.logger.info(`Create Governance: ${name}, ${url}, ${description}, ${erc721contract}, ${quorum}`);
    const encodedName = this.web3.utils.asciiToHex(name);
    const buildTx = await this.contract.methods.create(encodedName, url, description, erc721contract, quorum).send({
      from: this.wallet.getAddress(),
      gas: this.gas,
    });

    const event: EventData = buildTx.events['GovernanceContractCreated'];
    const governance = event.returnValues['governance'];
    const storage = event.returnValues['_storage'];
    const meta = event.returnValues['metaStorage'];
    if (governance && storage && meta) {
      const collective = { governanceAddress: governance, storageAddress: storage, metaAddress: meta };
      this.logger.info(
        `created governance: ${collective.governanceAddress}, storage: ${collective.storageAddress}, meta: ${collective.metaAddress}`
      );
      return collective;
    }
    throw new Error('Governance creation failed');
  }
}
