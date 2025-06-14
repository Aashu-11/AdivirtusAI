'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertTriangle, BarChart3, Users, Database, Zap } from 'lucide-react';

interface PendingSkill {
  id: string;
  skill_name: string;
  category: string;
  description: string;
  source_type: string;
  organization?: string;
  confidence_score: number;
  similarity_to_existing: number;
  similar_skills: any[];
  status: string;
  created_at: string;
}

interface TaxonomySkill {
  skill_id: string;
  canonical_name: string;
  category: string;
  subcategory?: string;
  description: string;
  usage_count: number;
  status: string;
}

interface SkillStats {
  taxonomy_count: number;
  pending_count: number;
  category_breakdown: any[];
}

export default function SkillsManagementPage() {
  const [activeTab, setActiveTab] = useState('pending');
  const [pendingSkills, setPendingSkills] = useState<PendingSkill[]>([]);
  const [taxonomySkills, setTaxonomySkills] = useState<TaxonomySkill[]>([]);
  const [skillStats, setSkillStats] = useState<SkillStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<PendingSkill | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject'>('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  
  // Filters
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPendingSkills(),
        loadTaxonomySkills(),
        loadSkillStats()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPendingSkills = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      
      const response = await fetch(`/api/skills/pending-skills/?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setPendingSkills(data.pending_skills);
      }
    } catch (error) {
      console.error('Error loading pending skills:', error);
    }
  };

  const loadTaxonomySkills = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/skills/taxonomy/?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setTaxonomySkills(data.skills);
      }
    } catch (error) {
      console.error('Error loading taxonomy skills:', error);
    }
  };

  const loadSkillStats = async () => {
    try {
      const response = await fetch('/api/skills/stats/');
      const data = await response.json();
      
      if (data.success) {
        setSkillStats(data);
      }
    } catch (error) {
      console.error('Error loading skill stats:', error);
    }
  };

  const handleApproveReject = async () => {
    if (!selectedSkill) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/skills/pending-skills/${selectedSkill.id}/approve/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: approvalAction,
          reviewer_id: 'current_user', // TODO: Get from auth context
          reason: rejectionReason
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setShowApprovalDialog(false);
        setSelectedSkill(null);
        setRejectionReason('');
        await loadPendingSkills();
        await loadSkillStats();
      }
    } catch (error) {
      console.error('Error processing approval:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'sop': return <Database className="h-4 w-4" />;
      case 'domain_knowledge': return <BarChart3 className="h-4 w-4" />;
      case 'job_description': return <Users className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const PendingSkillsTab = () => (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex gap-4 items-center">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="technical_skills">Technical Skills</SelectItem>
            <SelectItem value="soft_skills">Soft Skills</SelectItem>
            <SelectItem value="domain_knowledge">Domain Knowledge</SelectItem>
            <SelectItem value="standard_operating_procedures">SOPs</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={loadPendingSkills} disabled={loading}>
          Refresh
        </Button>
      </div>

      {/* Pending Skills List */}
      <div className="grid gap-4">
        {pendingSkills.map((skill) => (
          <Card key={skill.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">{skill.skill_name}</h3>
                  <Badge variant="outline">{skill.category}</Badge>
                  <div className="flex items-center gap-1">
                    {getSourceTypeIcon(skill.source_type)}
                    <span className="text-sm text-gray-600">{skill.source_type}</span>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{skill.description}</p>
                
                <div className="flex gap-4 text-sm">
                  <span className={`font-medium ${getConfidenceColor(skill.confidence_score)}`}>
                    Confidence: {(skill.confidence_score * 100).toFixed(1)}%
                  </span>
                  {skill.similarity_to_existing > 0 && (
                    <span className="text-orange-600">
                      Similar to existing: {(skill.similarity_to_existing * 100).toFixed(1)}%
                    </span>
                  )}
                  {skill.organization && (
                    <span className="text-blue-600">Org: {skill.organization}</span>
                  )}
                </div>
                
                {skill.similar_skills.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-500">Similar skills: </span>
                    {skill.similar_skills.slice(0, 3).map((similar, idx) => (
                      <Badge key={idx} variant="secondary" className="mr-1">
                        {similar.canonical_name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              {skill.status === 'pending' && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSkill(skill);
                      setApprovalAction('approve');
                      setShowApprovalDialog(true);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSkill(skill);
                      setApprovalAction('reject');
                      setShowApprovalDialog(true);
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
        
        {pendingSkills.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No pending skills found</p>
          </Card>
        )}
      </div>
    </div>
  );

  const TaxonomyTab = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <Input
          placeholder="Search skills..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-64"
        />
        
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="technical_skills">Technical Skills</SelectItem>
            <SelectItem value="soft_skills">Soft Skills</SelectItem>
            <SelectItem value="domain_knowledge">Domain Knowledge</SelectItem>
            <SelectItem value="standard_operating_procedures">SOPs</SelectItem>
          </SelectContent>
        </Select>
        
        <Button onClick={loadTaxonomySkills} disabled={loading}>
          Search
        </Button>
      </div>

      {/* Taxonomy Skills */}
      <div className="grid gap-4">
        {taxonomySkills.map((skill) => (
          <Card key={skill.skill_id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">{skill.canonical_name}</h3>
                  <Badge variant="outline">{skill.category}</Badge>
                  {skill.subcategory && (
                    <Badge variant="secondary">{skill.subcategory}</Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">{skill.description}</p>
                
                <div className="flex gap-4 text-sm text-gray-500">
                  <span>ID: {skill.skill_id}</span>
                  <span>Usage: {skill.usage_count} times</span>
                  <span>Status: {skill.status}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
        
        {taxonomySkills.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No skills found</p>
          </Card>
        )}
      </div>
    </div>
  );

  const StatsTab = () => (
    <div className="space-y-6">
      {skillStats && (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Skills</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{skillStats.taxonomy_count}</div>
                <p className="text-xs text-muted-foreground">In taxonomy</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{skillStats.pending_count}</div>
                <p className="text-xs text-muted-foreground">Awaiting approval</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Categories</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{skillStats.category_breakdown.length}</div>
                <p className="text-xs text-muted-foreground">Skill categories</p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Category Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {skillStats.category_breakdown.map((category, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="font-medium">{category.category}</span>
                    <Badge variant="outline">{category.count} skills</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Skills Management</h1>
        <p className="text-gray-600 mt-2">
          Manage your organization's skills taxonomy and review pending skill additions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="pending">
            Pending Skills {pendingSkills.filter(s => s.status === 'pending').length > 0 && (
              <Badge className="ml-2">{pendingSkills.filter(s => s.status === 'pending').length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="taxonomy">Skills Taxonomy</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          <PendingSkillsTab />
        </TabsContent>
        
        <TabsContent value="taxonomy" className="mt-6">
          <TaxonomyTab />
        </TabsContent>
        
        <TabsContent value="stats" className="mt-6">
          <StatsTab />
        </TabsContent>
      </Tabs>

      {/* Approval Dialog */}
      <Dialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {approvalAction === 'approve' ? 'Approve Skill' : 'Reject Skill'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedSkill && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">{selectedSkill.skill_name}</h4>
                <p className="text-sm text-gray-600">{selectedSkill.description}</p>
              </div>
              
              {approvalAction === 'reject' && (
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Rejection Reason
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Please provide a reason for rejection..."
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApprovalDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleApproveReject}
              disabled={loading || (approvalAction === 'reject' && !rejectionReason.trim())}
            >
              {approvalAction === 'approve' ? 'Approve' : 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 