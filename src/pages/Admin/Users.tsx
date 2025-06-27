import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Clock, AlertCircle } from 'lucide-react';
import { useRoleGuard } from '../../hooks/useRoleGuard';
import { supabase } from '../../lib/supabase';
import { UserRole } from '../../context/UserRoleContext';

interface UserWithRoles {
  user_id: string;
  email: string;
  user_created_at: string;
  roles: Array<{
    role: UserRole;
    granted_at: string;
    expires_at?: string;
    notes?: string;
  }>;
  active_roles: UserRole[];
  is_admin: boolean;
  is_operator: boolean;
  is_user: boolean;
}

const AdminUsers: React.FC = () => {
  // Solo admins pueden gestionar usuarios
  const { isAuthorized, isLoading: roleLoading } = useRoleGuard({
    requiredPermissions: ['users.manage'],
    redirectTo: '/unauthorized'
  });

  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [newRole, setNewRole] = useState<UserRole>('user');
  const [roleNotes, setRoleNotes] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [assigning, setAssigning] = useState(false);

  // Cargar usuarios con roles
  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users_with_roles')
        .select('*')
        .order('user_created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized && !roleLoading) {
      loadUsers();
    }
  }, [isAuthorized, roleLoading]);

  // Asignar rol a usuario
  const assignRole = async () => {
    if (!selectedUser) return;

    try {
      setAssigning(true);
      
      const expiresAtValue = expiresAt ? new Date(expiresAt).toISOString() : null;
      
      const { error } = await supabase.rpc('assign_role', {
        target_user_id: selectedUser.user_id,
        new_role: newRole,
        expires_at_param: expiresAtValue,
        notes_param: roleNotes || null
      });

      if (error) throw error;

      // Recargar usuarios
      await loadUsers();
      
      // Cerrar modal
      setShowAssignModal(false);
      setSelectedUser(null);
      setNewRole('user');
      setRoleNotes('');
      setExpiresAt('');

    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Error asignando rol: ' + (error as Error).message);
    } finally {
      setAssigning(false);
    }
  };

  // Revocar rol
  const revokeRole = async (userId: string, role: UserRole) => {
    if (!confirm(`¿Estás seguro de revocar el rol "${role}" a este usuario?`)) {
      return;
    }

    try {
      const { error } = await supabase.rpc('revoke_role', {
        target_user_id: userId,
        role_to_revoke: role,
        reason_param: 'Revocado por administrador desde interfaz'
      });

      if (error) throw error;
      await loadUsers();
    } catch (error) {
      console.error('Error revoking role:', error);
      alert('Error revocando rol: ' + (error as Error).message);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener color del badge según rol
  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'operator': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (roleLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-purple-600" />
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
        </div>
        
        <div className="text-sm text-gray-600">
          Total: {users.length} usuarios
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Roles Activos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registrado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {user.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        ID: {user.user_id.slice(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.active_roles.length > 0 ? (
                          user.active_roles.map((role) => (
                            <span
                              key={role}
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(role)}`}
                            >
                              {role}
                              {/* Botón para revocar rol */}
                              <button
                                onClick={() => revokeRole(user.user_id, role)}
                                className="ml-1 text-red-600 hover:text-red-800"
                                title={`Revocar rol ${role}`}
                              >
                                ×
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-sm">Sin roles</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.user_created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowAssignModal(true);
                        }}
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-900"
                      >
                        <UserPlus className="w-4 h-4" />
                        Asignar Rol
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para asignar rol */}
      {showAssignModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-purple-600 text-white p-4 rounded-t-lg">
              <div className="flex items-center gap-3">
                <Shield className="w-6 h-6" />
                <h2 className="text-lg font-bold">Asignar Rol</h2>
              </div>
              <p className="text-purple-200 text-sm mt-1">
                Usuario: {selectedUser.email}
              </p>
            </div>

            <div className="p-6 space-y-4">
              {/* Selección de rol */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rol a asignar
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="user">Usuario</option>
                  <option value="operator">Operador</option>
                  <option value="admin">Administrador</option>
                </select>
              </div>

              {/* Fecha de expiración opcional */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Fecha de expiración (opcional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Notas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  value={roleNotes}
                  onChange={(e) => setRoleNotes(e.target.value)}
                  rows={3}
                  placeholder="Razón para asignar este rol..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>

              {/* Advertencia para rol admin */}
              {newRole === 'admin' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <strong>Advertencia:</strong> El rol de administrador otorga acceso completo al sistema.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t p-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setSelectedUser(null);
                  setNewRole('user');
                  setRoleNotes('');
                  setExpiresAt('');
                }}
                className="px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={assignRole}
                disabled={assigning}
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {assigning ? 'Asignando...' : 'Asignar Rol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;