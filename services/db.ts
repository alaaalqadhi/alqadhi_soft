
import { PlateRecord } from '../types';

/**
 * Service to interact with the backend API for plate records.
 */
export const db = {
  isOpen: () => true,
  open: async () => {},
  plates: {
    reverse: function(entity: string = 'mukafaha') {
      return {
        toArray: async (): Promise<PlateRecord[]> => {
          const res = await fetch(`/api/plates/${entity}`);
          if (!res.ok) throw new Error('Failed to fetch');
          return res.json();
        }
      };
    },
    toArray: async (entity: string = 'mukafaha'): Promise<PlateRecord[]> => {
      const res = await fetch(`/api/plates/${entity}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    add: async (record: PlateRecord, entity: string = 'mukafaha'): Promise<{ success: boolean, message: string }> => {
      const res = await fetch(`/api/plates/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record),
      });
      if (!res.ok) throw new Error('Failed to save');
      return res.json();
    },
    update: async (id: string, changes: Partial<PlateRecord>, entity: string = 'mukafaha'): Promise<{ success: boolean, message: string }> => {
      const all = await fetch(`/api/plates/${entity}`).then(r => r.json());
      const existing = all.find((r: any) => r.id === id);
      if (!existing) throw new Error('Record not found');
      
      const updated = { ...existing, ...changes };
      const res = await fetch(`/api/plates/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      if (!res.ok) throw new Error('Failed to update');
      return res.json();
    },
    delete: async (id: string, entity: string = 'mukafaha'): Promise<{ success: boolean, message: string }> => {
      const res = await fetch(`/api/plates/${entity}/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      return res.json();
    }
  }
};

export const initDB = async () => {
  console.log("API Service initialized");
};
