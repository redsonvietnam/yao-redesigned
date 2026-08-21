import Dexie, { Table } from 'dexie';
import { SavedDocument, DictionaryEntry } from '../types';

export class DaoAppDatabase extends Dexie {
  documents!: Table<SavedDocument, string>;
  customDict!: Table<DictionaryEntry, number>;

  constructor() {
    super('ChuDaoButKyDatabase');
    this.version(1).stores({
      documents: 'id, title, updatedAt',
      customDict: '++id, raw, key, hanzi',
    });
  }
}

export const db = new DaoAppDatabase();
