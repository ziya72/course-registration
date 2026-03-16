import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const JobDashboard: React.FC = () => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Background Jobs</CardTitle>
          <CardDescription>
            Monitor the status of background processing jobs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No background jobs running</p>
            <p className="text-sm mt-2">
              Background jobs will appear here when CSV uploads are processed
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};