# Firestore Security Specification

This document provides a comprehensive security design, including data invariants, the adversarial "Dirty Dozen" payloads, and validation requirements for the Nexo Finance application. This is a Zero-TrustAttribute-Based Access Control (ABAC) design modeled around the actual schema structures defined in `firebase-blueprint.json`.

## 1. Data Invariants

1. **User Ownership Isolation**: Users can only read and write their own User documents, Projects, Transactions, and Assets.
2. **Project Referential Integrity**: A Transaction or Asset cannot be created unless its parent Project exists in the database and is owned by the same authenticated user.
3. **Strict Size Limits**: All string values are capped to protect against storage bloating and "Denial of Wallet" exhaustion.
4. **Key Whitelisting**: Creation payloads must contain exactly the required set of fields to block "Ghost/Shadow" fields from skewing system integrity.
5. **Timestamp Immutability**: All fields representing entry/creation times (e.g., `createdAt`) must align with standard `request.time`.

---

## 2. The "Dirty Dozen" Adversarial Payloads

These payloads simulate various attacks that must return `PERMISSION_DENIED` under all conditions:

### Payload 1: Identity Spoofing (User document path)
* **Goal**: Attackers attempt to read or overwrite another user's private setup.
* **HTTP Operation**: `set` on `/users/attacker_uid` writing data for `target_uid`.
* **Payload**:
  ```json
  { "id": "target_uid", "name": "Victim User", "email": "victim@gmail.com" }
  ```

### Payload 2: Project Owner Spoofing
* **Goal**: Attacker tries to create a project declaring a different owner to hijack resources or larp as someone else.
* **HTTP Operation**: `create` on `/projects/p_99`
* **Payload**:
  ```json
  { "id": "p_99", "name": "Fake Project", "type": "Pessoal", "ownerId": "victim_uid" }
  ```

### Payload 3: Shadow Update / Ghost Fields (Update-Gap)
* **Goal**: Attacker attempts to modify non-whitelisted fields on a project, injecting system flags.
* **HTTP Operation**: `update` on `/projects/p_user`
* **Payload**:
  ```json
  { "id": "p_user", "name": "My Project", "type": "Pessoal", "ownerId": "attacker_uid", "isSuperAdmin": true }
  ```

### Payload 4: Invalid Project Type (Type Poisoning)
* **Goal**: Inject an unsupported enum value into the project type to break frontend rendering.
* **HTTP Operation**: `create` on `/projects/p_err`
* **Payload**:
  ```json
  { "id": "p_err", "name": "Corrupt", "type": "SuperSecretHackerType", "ownerId": "attacker_uid" }
  ```

### Payload 5: Denial of Wallet (Resource Exhaustion)
* **Goal**: Upload an excessively large transaction title to abuse firestore storage billing.
* **HTTP Operation**: `create` on `/transactions/tx_huge`
* **Payload**:
  ```json
  { "id": "tx_huge", "title": "A...[1MB worth of characters]...A", "type": "Despesa", "projectId": "p1", "category": "Lazer", "amount": 100, "date": "2026-06-14", "ownerId": "attacker_uid" }
  ```

### Payload 6: Orphaned Transaction (Integrity Violation)
* **Goal**: Create a transaction pointing to a project ID that does not exist.
* **HTTP Operation**: `create` on `/transactions/tx_orph`
* **Payload**:
  ```json
  { "id": "tx_orph", "title": "Uber Trip", "type": "Despesa", "projectId": "non_existent_project", "category": "Transporte", "amount": 25, "date": "2026-06-14", "ownerId": "attacker_uid" }
  ```

### Payload 7: Cross-Project Injection (Referential Security Violation)
* **Goal**: Create a transaction pointing to a valid project ID that belongs to another victim user.
* **HTTP Operation**: `create` on `/transactions/tx_cross`
* **Payload**:
  ```json
  { "id": "tx_cross", "title": "Dinner", "type": "Despesa", "projectId": "victim_project_id", "category": "Alimentação", "amount": 80, "date": "2026-06-14", "ownerId": "attacker_uid" }
  ```

### Payload 8: Immutable Update (Change ownerId on Transaction)
* **Goal**: Attacker tries to transfer transactions to another user by changing ownerId.
* **HTTP Operation**: `update` on `/transactions/tx_1`
* **Payload**:
  ```json
  { "ownerId": "victim_uid" }
  ```

### Payload 9: Invalid Asset Category Value
* **Goal**: Inject random properties or invalid enum categories to break rendering.
* **HTTP Operation**: `create` on `/assets/a_err`
* **Payload**:
  ```json
  { "id": "a_err", "name": "Cryptoland", "category": "InvalidCategoryName", "value": 100000, "projectId": "p1", "ownerId": "attacker_uid" }
  ```

### Payload 10: Blanket Read Attempt
* **Goal**: Read entire list of projects without providing filter/ownership constraints, sniffing other users' financial projects.
* **HTTP Operation**: `list` on `/projects` without `where('ownerId', '==', auth.uid)`.
* **Expectation**: Must fail on rules due to absence of specific ownership evaluation.

### Payload 11: Cross-User Asset Sneak Read
* **Goal**: Read asset document belonging to another user.
* **HTTP Operation**: `get` on `/assets/victim_asset_id` by an attacker.
* **Expectation**: Denied because the document ownerId doesn't match the current authenticated user's ID.

### Payload 12: Invalid Path ID character Injection (ID Poisoning)
* **Goal**: Pass corrupted or dangerous symbols inside the path parameter (e.g. `../../admins/someId`) or highly bloated keys.
* **HTTP Operation**: `create` on `/projects/p_#$@%^*_bloated_attacker_id`
* **Expectation**: Blocked by string constraints or ID match validation functions.

---

## 3. Test Runner Design

To execute these tests, we would theoretically run the Firestore Emulator with the suite below (`firestore.rules.test.ts` outline):

```typescript
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { setDoc, getDoc, getDocs, collection, query, where, updateDoc } from 'firebase/firestore';

let testEnv: RulesTestEnvironment;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'my-app-nexo-finance',
    firestore: {
      rules: require('fs').readFileSync('firestore.rules', 'utf8')
    }
  });
});

afterAll(async () => {
  await testEnv.cleanup();
});

test('Pillar 1/2: User Profile Isolation', async () => {
  const aliceDb = testEnv.authenticatedContext('alice').firestore();
  const bobDb = testEnv.authenticatedContext('bob').firestore();
  
  // Alice cannot write Bob's profile
  await expect(
    setDoc(aliceDb.doc('users/bob'), { id: 'bob', name: 'Bob', email: 'bob@email.com' })
  ).rejects.toThrow();

  // Alice can write Alice's profile
  await expect(
    setDoc(aliceDb.doc('users/alice'), { id: 'alice', name: 'Alice', email: 'alice@email.com' })
  ).resolves.not.toThrow();
});

test('Pillar 3/11: Referential project creation & project isolation', async () => {
  const aliceDb = testEnv.authenticatedContext('alice').firestore();
  const bobDb = testEnv.authenticatedContext('bob').firestore();

  // Create Alice's project
  await setDoc(aliceDb.doc('projects/alice_proj'), {
    id: 'alice_proj',
    name: 'Alice Personal Fin',
    type: 'Pessoal',
    ownerId: 'alice'
  });

  // Bob cannot create a transaction inside Alice's project
  await expect(
    setDoc(bobDb.doc('transactions/bob_tx'), {
      id: 'bob_tx',
      title: 'Steal attempt',
      type: 'Despesa',
      projectId: 'alice_proj',
      category: 'Lazer',
      amount: 100,
      date: '2026-06-14',
      ownerId: 'bob'
    })
  ).rejects.toThrow();
});
```
