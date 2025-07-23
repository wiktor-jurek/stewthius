'use client';

import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type Row,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { VideoAnalysis } from '@/lib/actions';
import { ArrowUpDown, ExternalLink, Brain, Heart, Eye, MessageCircle, Share } from 'lucide-react';
import { trackExternalLink, trackTableInteraction } from '@/lib/analytics';

interface VideoTableProps {
  videos: VideoAnalysis[];
}

const VideoTable = ({ videos }: VideoTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'experimental':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'neutral':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'negative':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const formatCount = (count?: number) => {
    if (!count) return '0';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toLocaleString();
  };

  // Custom global filter function
  const globalFilterFn = (row: Row<VideoAnalysis>, columnId: string, value: string): boolean => {
    const searchValue = value.toLowerCase();
    const video = row.original;
    
    // Search in day
    const dayMatch = `day ${video.day}`.toLowerCase().includes(searchValue) || 
                    video.day.toString().includes(searchValue);
    
    // Search in sentiment
    const sentimentMatch = video.sentiment?.toLowerCase().includes(searchValue) || false;
    
    // Search in ingredients
    const ingredientsMatch = video.ingredientsAdded?.some(ingredient => 
      ingredient.toLowerCase().includes(searchValue)
    ) || false;
    
    // Search in key quote
    const quoteMatch = video.keyQuote?.toLowerCase().includes(searchValue) || false;
    
    return dayMatch || sentimentMatch || ingredientsMatch || quoteMatch;
  };

  const columns: ColumnDef<VideoAnalysis>[] = [
    {
      accessorKey: 'day',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Day
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const video = row.original;
        return (
          <div className="flex items-center gap-2">
            <span className="font-medium">Day {video.day}</span>
            {video.tiktokUrl && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  trackExternalLink(video.tiktokUrl!, 'tiktok', `video_table_day_${video.day}`);
                  window.open(video.tiktokUrl, '_blank');
                }}
                className="h-6 w-6 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'sentiment',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Sentiment
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const sentiment = row.getValue('sentiment') as string;
        return (
          <Badge variant="outline" className={getSentimentColor(sentiment)}>
            {sentiment}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'likeCount',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          <span className="hidden md:inline">Popularity</span>
          <span className="md:hidden">❤️</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const video = row.original;
        return (
          <div className="flex flex-col gap-1 text-xs">
            {video.likeCount !== undefined && video.likeCount > 0 && (
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3 text-red-500" />
                <span className="font-medium">{formatCount(video.likeCount)}</span>
              </div>
            )}
            {video.viewCount !== undefined && video.viewCount > 0 && (
              <div className="hidden md:flex items-center gap-1">
                <Eye className="h-3 w-3 text-blue-500" />
                <span>{formatCount(video.viewCount)}</span>
              </div>
            )}
            {video.commentCount !== undefined && video.commentCount > 0 && (
              <div className="hidden md:flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-green-500" />
                <span>{formatCount(video.commentCount)}</span>
              </div>
            )}
            {video.shareCount !== undefined && video.shareCount > 0 && (
              <div className="hidden md:flex items-center gap-1">
                <Share className="h-3 w-3 text-purple-500" />
                <span>{formatCount(video.shareCount)}</span>
              </div>
            )}
            {(!video.likeCount && !video.viewCount && !video.commentCount && !video.shareCount) && (
              <span className="text-muted-foreground">No data</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'ratingOverall',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          <span className="hidden md:inline">Rating</span>
          <span className="md:hidden">⭐</span>
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const rating = row.getValue('ratingOverall') as number;
        const video = row.original;
        const isInferred = video.ratingInferred;
        
        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className={`font-medium ${isInferred ? 'opacity-70' : ''}`}>
                  {rating}/10
                </span>
                {isInferred && (
                  <span title="AI Inferred Rating">
                    <Brain className="h-3 w-3 text-blue-500" />
                  </span>
                )}
              </div>
              <div className="hidden md:flex gap-1">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < rating 
                        ? isInferred 
                          ? 'bg-amber-300 opacity-60' 
                          : 'bg-amber-400'
                        : 'bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              {isInferred && (
                <Badge variant="outline" className="text-xs mt-1 bg-blue-50 text-blue-700 border-blue-200 hidden md:inline-flex">
                  AI Inferred
                </Badge>
              )}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'ingredientsAdded',
      header: 'Ingredients Added',
      cell: ({ row }) => {
        const ingredients = row.getValue('ingredientsAdded') as string[];
        if (!ingredients || ingredients.length === 0) {
          return <span className="text-muted-foreground">None</span>;
        }
        return (
          <div className="flex flex-wrap gap-1 max-w-xs">
            {ingredients.slice(0, 3).map((ingredient, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {ingredient}
              </Badge>
            ))}
            {ingredients.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{ingredients.length - 3} more
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'keyQuote',
      header: () => (
        <span className="hidden md:inline">Key Quote</span>
      ),
      cell: ({ row }) => {
        const quote = row.getValue('keyQuote') as string;
        if (!quote) return <span className="text-muted-foreground hidden md:inline">—</span>;
        return (
          <div className="max-w-xs hidden md:block">
            <p className="text-sm italic text-muted-foreground line-clamp-2">
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: videos,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: globalFilterFn,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Video Analysis Data
        </CardTitle>
        <CardDescription>
          Complete analysis of all videos with ratings, sentiment, and ingredients
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center py-4">
          <Input
            placeholder="Filter by day, sentiment, or ingredients..."
            value={globalFilter ?? ''}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              const value = event.target.value;
              setGlobalFilter(value);
              if (value.length > 0) {
                trackTableInteraction('video_table', 'filter', undefined, undefined);
              }
            }}
            className="max-w-sm"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="text-xs px-2 py-2">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className="text-xs"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="px-2 py-2">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-xs px-2 py-2"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="text-sm text-muted-foreground">
            Showing {table.getFilteredRowModel().rows.length} of{' '}
            {videos.length} video(s)
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                trackTableInteraction('video_table', 'previous_page', table.getState().pagination.pageIndex, table.getPageCount());
                table.previousPage();
              }}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                trackTableInteraction('video_table', 'next_page', table.getState().pagination.pageIndex + 2, table.getPageCount());
                table.nextPage();
              }}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoTable; 