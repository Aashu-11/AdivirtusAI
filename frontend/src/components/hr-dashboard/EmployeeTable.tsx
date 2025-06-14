'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { tw, utils } from '@/config/design-system'
import { EmployeeSummary, SortField, SortDirection, TableSort } from '@/types/hr-analytics'
import { hrAnalyticsUtils } from '@/services/hr-analytics'

interface EmployeeTableProps {
  employees: EmployeeSummary[];
  onEmployeeClick?: (employee: EmployeeSummary) => void;
  isLoading?: boolean;
}

export default function EmployeeTable({ employees, onEmployeeClick, isLoading = false }: EmployeeTableProps) {
  const [sort, setSort] = useState<TableSort>({ field: 'avg_competency', direction: 'desc' });
  const [filters, setFilters] = useState({
    department: '',
    competency_range: [0, 100] as [number, number],
    has_gaps: undefined as boolean | undefined
  });

  // Get unique departments for filter dropdown
  const departments = useMemo(() => 
    hrAnalyticsUtils.getUniqueDepartments(employees), 
    [employees]
  );

  // Apply filters and sorting
  const filteredAndSortedEmployees = useMemo(() => {
    let filtered = hrAnalyticsUtils.filterEmployees(employees, filters);
    return hrAnalyticsUtils.sortEmployees(filtered, sort.field, sort.direction);
  }, [employees, filters, sort]);

  const handleSort = (field: SortField) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sort.field !== field) {
      return (
        <svg className="w-4 h-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    
    return sort.direction === 'asc' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h9m5-4v12m0 0l-4-4m4 4l4-4" />
      </svg>
    );
  };

  if (isLoading) {
    return (
      <div className={utils.cn("p-8 rounded-xl border", tw.bg.card, tw.border.primary)}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={utils.cn("rounded-xl border", tw.bg.card, tw.border.primary)}
    >
      {/* Filters */}
      <div className="p-4 sm:p-6 border-b border-gray-800/30">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-[150px]">
            <label className={utils.cn(tw.typography.smallLabel, "block mb-2")}>
              Department
            </label>
            <select
              value={filters.department}
              onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
              className={utils.cn(
                "w-full px-3 py-2 rounded-lg border text-sm",
                tw.bg.nested,
                tw.border.primary,
                tw.text.primary,
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className={utils.cn(tw.typography.smallLabel, "block mb-2")}>
              Competency Range
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={filters.competency_range[0]}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  competency_range: [Number(e.target.value), prev.competency_range[1]]
                }))}
                className={utils.cn(
                  "w-full px-3 py-2 rounded-lg border text-sm",
                  tw.bg.nested,
                  tw.border.primary,
                  tw.text.primary,
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                placeholder="Min"
              />
              <input
                type="number"
                min="0"
                max="100"
                value={filters.competency_range[1]}
                onChange={(e) => setFilters(prev => ({ 
                  ...prev, 
                  competency_range: [prev.competency_range[0], Number(e.target.value)]
                }))}
                className={utils.cn(
                  "w-full px-3 py-2 rounded-lg border text-sm",
                  tw.bg.nested,
                  tw.border.primary,
                  tw.text.primary,
                  "focus:outline-none focus:ring-2 focus:ring-blue-500"
                )}
                placeholder="Max"
              />
            </div>
          </div>

          <div className="flex-1 min-w-[120px]">
            <label className={utils.cn(tw.typography.smallLabel, "block mb-2")}>
              Skill Gaps
            </label>
            <select
              value={filters.has_gaps === undefined ? '' : filters.has_gaps.toString()}
              onChange={(e) => setFilters(prev => ({ 
                ...prev, 
                has_gaps: e.target.value === '' ? undefined : e.target.value === 'true'
              }))}
              className={utils.cn(
                "w-full px-3 py-2 rounded-lg border text-sm",
                tw.bg.nested,
                tw.border.primary,
                tw.text.primary,
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              <option value="">All Employees</option>
              <option value="true">With Gaps</option>
              <option value="false">No Gaps</option>
            </select>
          </div>
        </div>
      </div>

      {/* Desktop Table */}
      <div className="hidden lg:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={utils.cn("border-b", tw.border.primary)}>
              <th 
                className={utils.cn(
                  "px-4 xl:px-6 py-4 text-left cursor-pointer hover:bg-gray-800/20 transition-colors",
                  tw.typography.bodyText,
                  "font-medium"
                )}
                onClick={() => handleSort('full_name')}
              >
                <div className="flex items-center gap-2">
                  Employee
                  {getSortIcon('full_name')}
                </div>
              </th>
              <th 
                className={utils.cn(
                  "px-4 xl:px-6 py-4 text-left cursor-pointer hover:bg-gray-800/20 transition-colors",
                  tw.typography.bodyText,
                  "font-medium"
                )}
                onClick={() => handleSort('department')}
              >
                <div className="flex items-center gap-2">
                  Department
                  {getSortIcon('department')}
                </div>
              </th>
              <th 
                className={utils.cn(
                  "px-4 xl:px-6 py-4 text-center cursor-pointer hover:bg-gray-800/20 transition-colors",
                  tw.typography.bodyText,
                  "font-medium"
                )}
                onClick={() => handleSort('avg_competency')}
              >
                <div className="flex items-center justify-center gap-2">
                  Competency
                  {getSortIcon('avg_competency')}
                </div>
              </th>
              <th 
                className={utils.cn(
                  "px-4 xl:px-6 py-4 text-center cursor-pointer hover:bg-gray-800/20 transition-colors",
                  tw.typography.bodyText,
                  "font-medium"
                )}
                onClick={() => handleSort('total_skills')}
              >
                <div className="flex items-center justify-center gap-2">
                  Skills
                  {getSortIcon('total_skills')}
                </div>
              </th>
              <th 
                className={utils.cn(
                  "px-4 xl:px-6 py-4 text-center cursor-pointer hover:bg-gray-800/20 transition-colors",
                  tw.typography.bodyText,
                  "font-medium"
                )}
                onClick={() => handleSort('skills_with_gaps')}
              >
                <div className="flex items-center justify-center gap-2">
                  Gaps
                  {getSortIcon('skills_with_gaps')}
                </div>
              </th>
              <th className={utils.cn("px-4 xl:px-6 py-4 text-center", tw.typography.bodyText, "font-medium")}>
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedEmployees.map((employee, index) => (
              <motion.tr
                key={employee.user_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="border-b border-gray-800/20 hover:bg-gray-800/10 transition-colors"
              >
                <td className="px-4 xl:px-6 py-4">
                  <div>
                    <div className={utils.cn("font-medium", tw.text.primary)}>
                      {employee.full_name}
                    </div>
                    <div className={utils.cn("text-sm", tw.text.tertiary)}>
                      {employee.email}
                    </div>
                  </div>
                </td>
                <td className="px-4 xl:px-6 py-4">
                  <span className={utils.cn("text-sm", tw.text.secondary)}>
                    {employee.department || 'Unassigned'}
                  </span>
                </td>
                <td className="px-4 xl:px-6 py-4 text-center">
                  <span className={utils.cn(
                    "px-2 py-1 rounded-md text-sm font-medium",
                    employee.avg_competency >= 80 ? "bg-green-500/20 text-green-400" :
                    employee.avg_competency >= 60 ? "bg-blue-500/20 text-blue-400" :
                    employee.avg_competency >= 40 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  )}>
                    {Math.round(employee.avg_competency || 0)}%
                  </span>
                </td>
                <td className="px-4 xl:px-6 py-4 text-center">
                  <span className={utils.cn("text-sm", tw.text.secondary)}>
                    {employee.total_skills || 0}
                  </span>
                </td>
                <td className="px-4 xl:px-6 py-4 text-center">
                  <span className={utils.cn(
                    "px-2 py-1 rounded-md text-sm font-medium",
                    (employee.skills_with_gaps || 0) > 0 ? "bg-orange-500/20 text-orange-400" : "bg-gray-500/20 text-gray-400"
                  )}>
                    {employee.skills_with_gaps || 0}
                  </span>
                </td>
                <td className="px-4 xl:px-6 py-4 text-center">
                  <button
                    onClick={() => onEmployeeClick?.(employee)}
                    className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    View Details
                  </button>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="lg:hidden p-4 space-y-4">
        {filteredAndSortedEmployees.map((employee, index) => (
          <motion.div
            key={employee.user_id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="p-4 rounded-xl border border-gray-700/30 backdrop-blur-xl"
            style={{ background: 'rgba(10, 10, 12, 0.7)' }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1 min-w-0">
                <h4 className={utils.cn("font-medium truncate", tw.text.primary)}>
                  {employee.full_name}
                </h4>
                <p className={utils.cn("text-sm truncate", tw.text.tertiary)}>
                  {employee.email}
                </p>
                <p className={utils.cn("text-sm", tw.text.secondary)}>
                  {employee.department || 'Unassigned'}
                </p>
              </div>
              <button
                onClick={() => onEmployeeClick?.(employee)}
                className="px-3 py-1 text-sm text-blue-400 hover:text-blue-300 transition-colors flex-shrink-0"
              >
                View
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Competency</div>
                <span className={utils.cn(
                  "px-2 py-1 rounded-md text-sm font-medium",
                  employee.avg_competency >= 80 ? "bg-green-500/20 text-green-400" :
                  employee.avg_competency >= 60 ? "bg-blue-500/20 text-blue-400" :
                  employee.avg_competency >= 40 ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-red-500/20 text-red-400"
                )}>
                  {Math.round(employee.avg_competency || 0)}%
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Skills</div>
                <span className={utils.cn("text-sm", tw.text.secondary)}>
                  {employee.total_skills || 0}
                </span>
              </div>
              
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Gaps</div>
                <span className={utils.cn(
                  "px-2 py-1 rounded-md text-sm font-medium",
                  (employee.skills_with_gaps || 0) > 0 ? "bg-orange-500/20 text-orange-400" : "bg-gray-500/20 text-gray-400"
                )}>
                  {employee.skills_with_gaps || 0}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedEmployees.length === 0 && (
        <div className="p-8 text-center">
          <div className={utils.cn("text-lg mb-2", tw.text.secondary)}>
            No employees found
          </div>
          <div className={utils.cn("text-sm", tw.text.tertiary)}>
            Try adjusting your filters or search criteria
          </div>
        </div>
      )}
    </motion.div>
  );
} 