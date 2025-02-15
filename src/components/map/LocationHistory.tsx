
import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { LocationHistoryEntry } from '@/types/map';

interface LocationHistoryProps {
  locations: LocationHistoryEntry[];
  onLocationSelect?: (location: LocationHistoryEntry) => void;
}

export const LocationHistory = ({ locations, onLocationSelect }: LocationHistoryProps) => {
  return (
    <ScrollArea className="h-[300px] rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Time</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Speed</TableHead>
            <TableHead>Accuracy</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {locations.map((location) => (
            <TableRow
              key={location.timestamp}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => onLocationSelect?.(location)}
            >
              <TableCell>
                {format(new Date(location.timestamp), 'HH:mm:ss')}
              </TableCell>
              <TableCell>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
              </TableCell>
              <TableCell>
                {location.speed ? `${(location.speed * 3.6).toFixed(1)} km/h` : '-'}
              </TableCell>
              <TableCell>
                {location.accuracy ? `${location.accuracy.toFixed(0)}m` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ScrollArea>
  );
};
