/**
 * Exemple d'utilisation complète des stores et utilitaires
 * Ce composant montre comment intégrer userStore, formatters, validators et constants
 */
import { useState } from 'react';
import type { UserRole } from '@/types';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  MenuItem,
} from '@mui/material';

// Import du store
import { useUserStore } from '../../store';

// Import des utilitaires
import { formatFullName, formatRole, formatDateTime } from '../../utils/formatters';
import { isValidEmail } from '../../utils/validators';
import { ROLES, ROLE_LABELS, VALIDATION_MESSAGES } from '../../utils/constants';

interface FormData {
  search: string;
  role: UserRole | 'all';
}

const UserStoreExample: React.FC = () => {
  // Accès au store Zustand
  const {
    users,
    filters,
    pagination,
    setFilters,
    setPagination,
    getFilteredUsers,
    getPaginatedUsers,
    getUserStats,
  } = useUserStore();

  const [formData, setFormData] = useState<FormData>({
    search: '',
    role: 'all',
  });

  // Obtenir les utilisateurs filtrés et paginés
  const { users: paginatedUsers, total } = getPaginatedUsers();
  
  // Obtenir les statistiques
  const stats = getUserStats();

  // Gérer le changement de recherche
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    setFormData({ ...formData, search: value });
    setFilters({ search: value });
  };

  // Gérer le changement de filtre de rôle
  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value as UserRole | 'all';
    setFormData({ ...formData, role: value });
    setFilters({ role: value });
  };

  // Gérer le changement de page
  const handlePageChange = (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number): void => {
    setPagination({ page: newPage + 1 });
  };

  // Gérer le changement de lignes par page
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setPagination({ 
      perPage: parseInt(event.target.value, 10),
      page: 1 
    });
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Exemple d'Utilisation des Stores et Utilitaires
      </Typography>

      {/* Statistiques */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Total Utilisateurs</Typography>
          <Typography variant="h3">{stats.total}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Administrateurs</Typography>
          <Typography variant="h3">{stats.admins}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Responsables</Typography>
          <Typography variant="h3">{stats.responsables}</Typography>
        </Paper>
        <Paper sx={{ p: 2, flex: 1 }}>
          <Typography variant="h6">Utilisateurs</Typography>
          <Typography variant="h3">{stats.users}</Typography>
        </Paper>
      </Box>

      {/* Filtres */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Rechercher"
            value={formData.search}
            onChange={handleSearchChange}
            placeholder="Nom, prénom ou email..."
            sx={{ flex: 1 }}
          />
          <TextField
            select
            label="Rôle"
            value={formData.role}
            onChange={handleRoleChange}
            sx={{ minWidth: 200 }}
          >
            <MenuItem value="all">Tous les rôles</MenuItem>
            {Object.entries(ROLE_LABELS).map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Alerte filtrage */}
      {filters.search || filters.role !== 'all' ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {total} utilisateur(s) trouvé(s) sur {users.length} au total
        </Alert>
      ) : null}

      {/* Tableau des utilisateurs */}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Nom Complet</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Rôle</TableCell>
              <TableCell>Créé le</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  Aucun utilisateur trouvé
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>
                    {/* Utilisation du formatter */}
                    {formatFullName(user.prenom, user.nom)}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={formatRole(user.role)} 
                      color={user.role === ROLES.ADMIN ? 'error' : user.role === ROLES.RESPONSABLE ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {/* Utilisation du formatter de date */}
                    {formatDateTime(user.created_at)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        <TablePagination
          component="div"
          count={total}
          page={pagination.page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={pagination.perPage}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25, 50]}
          labelRowsPerPage="Lignes par page:"
          labelDisplayedRows={({ from, to, count }) => 
            `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
          }
        />
      </Paper>

      {/* Informations de debug */}
      <Paper sx={{ p: 2, mt: 3, bgcolor: 'grey.100' }}>
        <Typography variant="subtitle2" gutterBottom>
          État du Store (Debug)
        </Typography>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify({
            totalUsers: users.length,
            filteredUsers: getFilteredUsers().length,
            currentPage: pagination.page,
            perPage: pagination.perPage,
            filters,
            stats
          }, null, 2)}
        </pre>
      </Paper>

      {/* Exemples d'utilisation des validators */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Exemples de Validation
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert severity="success">
            ✅ Email valide: {isValidEmail('test@example.com') ? 'Oui' : 'Non'}
          </Alert>
          <Alert severity="error">
            ❌ Email invalide: {isValidEmail('invalid-email') ? 'Oui' : 'Non'}
          </Alert>
        </Box>
      </Paper>

      {/* Exemples de constantes */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          Constantes Disponibles
        </Typography>
        <Typography variant="body2" component="div">
          <strong>Rôles:</strong> {Object.keys(ROLE_LABELS).join(', ')}
        </Typography>
        <Typography variant="body2" component="div" sx={{ mt: 1 }}>
          <strong>Message validation email:</strong> {VALIDATION_MESSAGES.EMAIL_INVALID}
        </Typography>
      </Paper>
    </Box>
  );
};

export default UserStoreExample;
