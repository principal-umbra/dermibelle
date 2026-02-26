
import { StockLog } from '../../types';

const DB_NAME = 'Dermibelle_StockLogs'; // Reuse main DB connection actually, but logic separation here
const STORE_NAME = 'stock_logs';

// We use the shared DB instance from services/db.ts for transaction consistency if needed,
// but for simple logging, we can use the generic helpers or the main instance.
// Using the main db instance exported from services/db.ts is best practice.
import { db } from '../db';

class StockLogsDatabase {
  
  async getAll(): Promise<StockLog[]> {
    return db.getAll<StockLog>(STORE_NAME);
  }

  async add(log: StockLog): Promise<void> {
    return db.add(STORE_NAME, log);
  }
}

export const stockLogsDB = new StockLogsDatabase();
