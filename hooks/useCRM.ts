
import { useState, useEffect } from 'react';
import { Client, User, WikiArticle } from '../types';
import { ClientLog } from '../context/DataContext';
import { clientsDB } from '../services/database/clients.db';
import { usersDB } from '../services/database/users.db';
import { wikiDB } from '../services/database/wiki.db';
import { generateId } from '../utils/helpers';

export const useCRM = (addToast: (type: 'success' | 'error' | 'info', msg: string) => void) => {
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [wikiArticles, setWikiArticles] = useState<WikiArticle[]>([]);
  const [clientLogs, setClientLogs] = useState<ClientLog[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [dbClients, dbUsers, dbWiki] = await Promise.all([
          clientsDB.getAll(),
          usersDB.getAll(),
          wikiDB.getAll()
        ]);
        setClients(dbClients.reverse());
        setUsers(dbUsers);
        setWikiArticles(dbWiki);
      } catch (e) {
        console.error("Error loading CRM data", e);
      }
    };
    load();
  }, []);

  const addClient = (data: Omit<Client, 'id'>) => {
    const id = generateId('C');
    const newClient = { ...data, id };
    clientsDB.add(newClient).then(() => {
      setClients(prev => [newClient, ...prev]);
    });
    return id;
  };

  const updateClient = (id: string, data: Partial<Client>) => {
    const client = clients.find(c => c.id === id);
    if (client) {
      const updated = { ...client, ...data };
      clientsDB.update(updated).then(() => {
        setClients(prev => prev.map(c => c.id === id ? updated : c));
      });
    }
  };

  const addUser = (user: User) => {
    usersDB.add(user).then(() => {
      setUsers(prev => [...prev, user]);
      addToast('success', 'Usuario agregado');
    });
  };

  const updateUser = (id: string, data: Partial<User>) => {
    const user = users.find(u => u.id === id);
    if (user) {
      const updated = { ...user, ...data };
      usersDB.update(updated).then(() => {
        setUsers(prev => prev.map(u => u.id === id ? updated : u));

        // Sync with session if it's the current user
        const savedUser = localStorage.getItem('dermibelle_auth_user');
        if (savedUser) {
          const authUser = JSON.parse(savedUser);
          if (authUser.id === id) {
            localStorage.setItem('dermibelle_auth_user', JSON.stringify(updated));
            // We can't call setCurrentUser here because we are in useCRM, 
            // but DataContext will trigger a re-render if we expose a way or if we move this logic.
          }
        }
      });
    }
  };


  const deleteUser = (id: string) => {
    usersDB.delete(id).then(() => {
      setUsers(prev => prev.filter(u => u.id !== id));
      addToast('success', 'Usuario eliminado');
    });
  };

  const addClientLog = (log: Omit<ClientLog, 'id' | 'timestamp'>) => {
    const newLog = { ...log, id: generateId('LOG'), timestamp: Date.now() };
    setClientLogs(prev => [newLog, ...prev]);
  };

  return {
    clients,
    setClients,
    users,
    setUsers,
    wikiArticles,
    setWikiArticles,
    clientLogs,
    setClientLogs,
    addClient,
    updateClient,
    addUser,
    updateUser,
    deleteUser,
    addClientLog
  };
};
