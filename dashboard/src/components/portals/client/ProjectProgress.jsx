import React, { useState, useEffect } from 'react';
import { useRBAC } from '../../../services/rbacService';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  CheckCircle,
  Clock,
  User,
  Activity,
  ChevronRight,
  Search,
  Filter,
  X,
  Briefcase,
  AlertCircle,
  Check
} from 'lucide-react';

const ProjectProgress = () => {
  const { currentUser } = useRBAC();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = () => {
    setLoading(true);
    // Mock data - replace with actual API calls
    setTimeout(() => {
      const mockProjects = [
        {
          id: 1,
          name: 'Website Redesign',
          description: 'Complete redesign of company website with modern UI/UX',
          status: 'in_progress',
          progress: 85,
          startDate: '2024-01-01',
          dueDate: '2024-01-25',
          editor: {
            name: 'John Editor',
            email: 'john@example.com',
            avatar: 'JE'
          },
          milestones: [
            { id: 1, title: 'Initial Design Mockups', completed: true, date: '2024-01-05' },
            { id: 2, title: 'Homepage Development', completed: true, date: '2024-01-10' },
            { id: 3, title: 'Content Pages', completed: true, date: '2024-01-15' },
            { id: 4, title: 'Mobile Optimization', completed: false, date: '2024-01-20' },
            { id: 5, title: 'Testing & Launch', completed: false, date: '2024-01-25' }
          ],
          recentActivity: [
            { date: '2024-01-15', activity: 'Homepage design completed and deployed to staging' },
            { date: '2024-01-14', activity: 'Content pages structure finalized' },
            { date: '2024-01-12', activity: 'Navigation menu implemented' }
          ]
        },
        {
          id: 2,
          name: 'Blog Content Creation',
          description: 'Creating engaging blog content for marketing campaigns',
          status: 'in_progress',
          progress: 60,
          startDate: '2024-01-08',
          dueDate: '2024-01-30',
          editor: {
            name: 'Jane Writer',
            email: 'jane@example.com',
            avatar: 'JW'
          },
          milestones: [
            { id: 1, title: 'Content Strategy', completed: true, date: '2024-01-10' },
            { id: 2, title: 'First 5 Articles', completed: true, date: '2024-01-15' },
            { id: 3, title: 'SEO Optimization', completed: false, date: '2024-01-22' },
            { id: 4, title: 'Final Review', completed: false, date: '2024-01-28' }
          ],
          recentActivity: [
            { date: '2024-01-14', activity: 'Published article: "Digital Marketing Trends 2024"' },
            { date: '2024-01-13', activity: 'Completed SEO research for upcoming articles' },
            { date: '2024-01-11', activity: 'Content calendar finalized' }
          ]
        },
        {
          id: 3,
          name: 'Marketing Materials',
          description: 'Design and development of marketing brochures and digital assets',
          status: 'review',
          progress: 75,
          startDate: '2023-12-15',
          dueDate: '2024-01-20',
          editor: {
            name: 'Mike Designer',
            email: 'mike@example.com',
            avatar: 'MD'
          },
          milestones: [
            { id: 1, title: 'Brand Guidelines', completed: true, date: '2023-12-20' },
            { id: 2, title: 'Brochure Design', completed: true, date: '2024-01-05' },
            { id: 3, title: 'Digital Assets', completed: true, date: '2024-01-12' },
            { id: 4, title: 'Client Review', completed: false, date: '2024-01-18' }
          ],
          recentActivity: [
            { date: '2024-01-13', activity: 'All digital assets completed and ready for review' },
            { date: '2024-01-10', activity: 'Brochure design approved by internal team' },
            { date: '2024-01-08', activity: 'Social media templates created' }
          ]
        },
        {
          id: 4,
          name: 'E-commerce Platform',
          description: 'Development of custom e-commerce solution',
          status: 'completed',
          progress: 100,
          startDate: '2023-11-01',
          dueDate: '2023-12-31',
          completedDate: '2023-12-28',
          editor: {
            name: 'Sarah Developer',
            email: 'sarah@example.com',
            avatar: 'SD'
          },
          milestones: [
            { id: 1, title: 'Database Design', completed: true, date: '2023-11-15' },
            { id: 2, title: 'User Interface', completed: true, date: '2023-12-01' },
            { id: 3, title: 'Payment Integration', completed: true, date: '2023-12-15' },
            { id: 4, title: 'Testing & Launch', completed: true, date: '2023-12-28' }
          ],
          recentActivity: [
            { date: '2023-12-28', activity: 'Project successfully launched and delivered' },
            { date: '2023-12-25', activity: 'Final testing completed' },
            { date: '2023-12-20', activity: 'Payment gateway integration tested' }
          ]
        }
      ];
      setProjects(mockProjects);
      setLoading(false);
    }, 1000);
  };

  const filteredProjects = projects.filter(project => {
    if (filter === 'all') return true;
    return project.status === filter;
  });

  const getStatusBadge = (status) => {
    const styles = {
      in_progress: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300',
      review: 'bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300',
      completed: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300',
      on_hold: 'bg-slate-100 dark:bg-slate-700/50 text-slate-800 dark:text-slate-300'
    };

    return (
      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${styles[status]}`}>
        {status.replace('_', ' ').toUpperCase()}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Project Progress</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Track the status and progress of all your projects.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Projects' },
          { key: 'in_progress', label: 'In Progress' },
          { key: 'review', label: 'Under Review' },
          { key: 'completed', label: 'Completed' },
          { key: 'on_hold', label: 'On Hold' }
        ].map((filterOption) => (
          <button
            key={filterOption.key}
            onClick={() => setFilter(filterOption.key)}
            className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === filterOption.key
              ? 'text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
          >
            {filter === filterOption.key && (
              <motion.div
                layoutId="activeFilter"
                className="absolute inset-0 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{filterOption.label}</span>
          </button>
        ))}
      </div>

      {/* Projects Grid */}
      <motion.div
        layout
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <AnimatePresence mode="popLayout">
          {filteredProjects.map((project) => (
            <motion.div
              layout
              key={project.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -5 }}
              className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl shadow-sm border border-slate-200/60 dark:border-slate-700/60 overflow-hidden cursor-pointer group hover:shadow-xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300"
              onClick={() => setSelectedProject(project)}
            >
              <div className="p-6">
                {/* Project Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {project.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">{project.description}</p>
                  </div>
                  {getStatusBadge(project.status)}
                </div>

                {/* Progress Bar */}
                <div className="mb-6">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">Progress</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{project.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${project.progress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="bg-indigo-600 dark:bg-indigo-500 h-2.5 rounded-full"
                    />
                  </div>
                </div>

                {/* Project Details */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-white dark:ring-slate-800">
                      {project.editor.avatar}
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Editor</p>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{project.editor.name}</p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-slate-500 dark:text-slate-400">Due Date</p>
                    <p className={`text-sm font-medium ${getDaysRemaining(project.dueDate) < 0 ? 'text-red-600 dark:text-red-400' :
                      getDaysRemaining(project.dueDate) <= 3 ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-white'
                      }`}>
                      {formatDate(project.dueDate)}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {filteredProjects.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-2xl border border-dashed border-slate-200/60 dark:border-slate-700/60"
        >
          <Briefcase className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No projects found</h3>
          <p className="text-slate-600 dark:text-slate-400">No projects match the selected filter.</p>
        </motion.div>
      )}

      {/* Project Detail Modal */}
      <AnimatePresence>
        {selectedProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProject(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-200/60 dark:border-slate-700/60 w-full max-w-4xl max-h-[90vh] overflow-y-auto relative z-10 custom-scrollbar"
            >
              <div className="sticky top-0 z-20 px-6 py-5 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">
                    {selectedProject.name}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400">{selectedProject.description}</p>
                </div>
                <button
                  onClick={() => setSelectedProject(null)}
                  className="p-2 text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Project Info */}
                  <div className="space-y-6">
                    <div className="bg-slate-50 dark:bg-slate-700/30 rounded-xl p-5 space-y-4">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <AlertCircle size={20} className="text-indigo-500" />
                        Project Information
                      </h3>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-600/50">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">Status</span>
                          {getStatusBadge(selectedProject.status)}
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-600/50">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">Progress</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{selectedProject.progress}%</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-600/50">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">Start Date</span>
                          <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <Calendar size={14} />
                            {formatDate(selectedProject.startDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-600/50">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">Due Date</span>
                          <span className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                            <Clock size={14} />
                            {formatDate(selectedProject.dueDate)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white dark:bg-slate-800 rounded-lg border border-slate-100 dark:border-slate-600/50">
                          <span className="text-slate-600 dark:text-slate-400 text-sm">Editor</span>
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-white dark:ring-slate-800">
                              {selectedProject.editor.avatar}
                            </div>
                            <span className="font-medium text-slate-900 dark:text-white">{selectedProject.editor.name}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                      <CheckCircle size={20} className="text-indigo-500" />
                      Milestones
                    </h3>
                    <div className="space-y-3">
                      {selectedProject.milestones.map((milestone) => (
                        <div key={milestone.id} className="flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${milestone.completed
                            ? 'bg-emerald-500 text-white'
                            : 'bg-slate-200 dark:bg-slate-600 text-transparent'
                            }`}>
                            <Check size={12} strokeWidth={3} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                              <span className={`font-medium ${milestone.completed ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'
                                }`}>
                                {milestone.title}
                              </span>
                              <span className="text-xs text-slate-400 whitespace-nowrap">{formatDate(milestone.date)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8 pt-8 border-t border-slate-100 dark:border-slate-700/60">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Activity size={20} className="text-indigo-500" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {selectedProject.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mt-2"></div>
                          {index !== selectedProject.recentActivity.length - 1 && (
                            <div className="w-0.5 h-full bg-slate-100 dark:bg-slate-700 my-1"></div>
                          )}
                        </div>
                        <div className="flex-1 bg-slate-50 dark:bg-slate-700/30 rounded-xl p-4">
                          <p className="text-sm text-slate-900 dark:text-white font-medium">{activity.activity}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                            <Clock size={12} />
                            {formatDate(activity.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Helper for Check icon since it wasn't imported
const Check = ({ size, strokeWidth, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default ProjectProgress;