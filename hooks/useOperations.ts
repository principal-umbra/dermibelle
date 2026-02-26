
import { useState, useEffect } from 'react';
import { Appointment } from '../types';
import { appointmentsDB } from '../services/database/appointments.db';
import { generateId } from '../utils/helpers';

export const useOperations = (
    addToast: (type: 'success'|'error'|'info', msg: string) => void,
    addNotification: (notif: any) => void
) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const dbAppointments = await appointmentsDB.getAll();
        setAppointments(dbAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } catch (e) {
        console.error("Error loading appointments", e);
      }
    };
    load();
  }, []);

  const addAppointment = (appt: Omit<Appointment, 'id' | 'createdAt' | 'isArchived'>) => {
      const id = generateId('APT');
      const newAppt: Appointment = {
          ...appt,
          id,
          createdAt: Date.now(),
          isArchived: false,
      };
      
      appointmentsDB.add(newAppt).then(() => {
          setAppointments(prev => [newAppt, ...prev]);
          addToast('success', 'Cita creada.');
          
          addNotification({
              type: 'new_appointment',
              title: 'Nueva Cita Agendada',
              message: `${newAppt.clientName} ha reservado para el ${newAppt.date}`,
              time: 'Ahora mismo',
              link: '/admin/appointments'
          });
      });
      
      return id; // ID needed for linking logic
  };

  const updateAppointment = (id: string, data: Partial<Appointment>) => {
      const appt = appointments.find(a => a.id === id);
      if (appt) {
          const updated = { ...appt, ...data };
          appointmentsDB.update(updated).then(() => {
              setAppointments(prev => prev.map(a => a.id === id ? updated : a));
          });
      }
  };

  const archiveFinishedAppointments = () => {
      const updatedList = appointments.map(a => 
          (a.status === 'Finalized' || a.status === 'Cancelled') ? { ...a, isArchived: true } : a
      );
      const toUpdate = updatedList.filter(a => a.isArchived && !appointments.find(old => old.id === a.id && old.isArchived));
      Promise.all(toUpdate.map(a => appointmentsDB.update(a))).then(() => {
          setAppointments(updatedList);
          addToast('success', 'Citas finalizadas archivadas');
      });
  };

  return {
    appointments,
    setAppointments,
    addAppointment,
    updateAppointment,
    archiveFinishedAppointments
  };
};
