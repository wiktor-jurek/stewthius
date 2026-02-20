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
import Link from 'next/link';
import { ArrowUpDown, Brain, Heart, Eye, MessageCircle, Share } from 'lucide-react';
import { trackTableInteraction } from '@/lib/analytics';

interface VideoTableProps {
  videos: VideoAnalysis[];
}

const VideoTable = ({ videos }: VideoTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState('');

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'super positive':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-700';
      case 'positive':
        return 'bg-herb-green/10 text-herb-green border-herb-green/30';
      case 'neutral':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
      case 'negative':
        return 'bg-burnt-tomato/10 text-burnt-tomato border-burnt-tomato/30';
      case 'super negative':
        return 'bg-red-100 text-red-900 border-red-400 dark:bg-red-900/30 dark:text-red-300 dark:border-red-700';
      default:
        return 'bg-muted text-muted-foreground border-border';
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

  const globalFilterFn = (row: Row<VideoAnalysis>, columnId: string, value: string): boolean => {
    const searchValue = value.toLowerCase();
    const video = row.original;

    const dayMatch = `day ${video.day}`.toLowerCase().includes(searchValue) ||
      video.day.toString().includes(searchValue);
    const sentimentMatch = video.sentiment?.toLowerCase().includes(searchValue) || false;
    const ingredientsMatch = video.ingredientsAdded?.some(ingredient =>
      ingredient.toLowerCase().includes(searchValue)
    ) || false;
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
          <Link
            href={`/video/${video.day}`}
            className="font-medium hover:text-broth-amber transition-colors"
          >
            Day {video.day}
          </Link>
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
                <Heart className="h-3 w-3 text-burnt-tomato" />
                <span className="font-medium">{formatCount(video.likeCount)}</span>
              </div>
            )}
            {video.viewCount !== undefined && video.viewCount > 0 && (
              <div className="hidden md:flex items-center gap-1">
                <Eye className="h-3 w-3 text-broth-amber" />
                <span>{formatCount(video.viewCount)}</span>
              </div>
            )}
            {video.commentCount !== undefined && video.commentCount > 0 && (
              <div className="hidden md:flex items-center gap-1">
                <MessageCircle className="h-3 w-3 text-herb-green" />
                <span>{formatCount(video.commentCount)}</span>
              </div>
            )}
            {video.shareCount !== undefined && video.shareCount > 0 && (
              <div className="hidden md:flex items-center gap-1">
                <Share className="h-3 w-3 text-chart-5" />
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

        const ratingStyle =
          rating >= 9
            ? 'text-base font-extrabold text-broth-amber drop-shadow-[0_0_6px_rgba(217,119,47,0.4)]'
            : rating >= 7
              ? 'text-sm font-bold text-herb-green'
              : rating <= 3
                ? 'text-sm font-bold text-burnt-tomato [transform:rotate(-1deg)_skewX(-2deg)]'
                : rating <= 5
                  ? 'text-sm font-medium text-burnt-tomato/80'
                  : 'text-sm font-medium';

        return (
          <div className="flex items-center gap-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className={`${ratingStyle} ${isInferred ? 'opacity-70' : ''}`}>
                  {rating}/10
                </span>
                {isInferred && (
                  <span title="AI Inferred Rating">
                    <Brain className="h-3 w-3 text-broth-amber" />
                  </span>
                )}
              </div>
              <div className="hidden md:flex gap-1">
                {[...Array(10)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i < rating
                        ? isInferred
                          ? 'bg-broth-amber/50'
                          : 'bg-broth-amber'
                        : 'bg-border'
                      }`}
                  />
                ))}
              </div>
              {isInferred && (
                <Badge variant="outline" className="text-xs mt-1 bg-broth-amber/10 text-broth-amber border-broth-amber/30 hidden md:inline-flex">
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
        const sentiment = row.original.sentiment?.toLowerCase();
        if (!quote) return <span className="text-muted-foreground hidden md:inline">—</span>;

        const quoteStyle =
          sentiment === 'negative' || sentiment === 'super negative'
            ? 'text-sm font-semibold italic text-burnt-tomato/90 line-clamp-3'
            : (sentiment === 'positive' || sentiment === 'super positive') && row.original.ratingOverall >= 8
              ? 'text-sm italic text-herb-green/80 line-clamp-2'
              : 'text-sm italic text-muted-foreground line-clamp-2';

        return (
          <div className="max-w-xs hidden md:block">
            <p className={quoteStyle}>
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
          📝 The Tasting Notes
        </CardTitle>
        <CardDescription>
          Every chapter of the stew&apos;s story — ratings, sentiment, and ingredients from each day
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center py-4">
          <Input
            placeholder="Search by day, sentiment, or ingredients..."
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
        <div className="rounded-xl border overflow-hidden">
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
            {videos.length} tasting note(s)
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
