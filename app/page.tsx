
"use client";

import { useState } from "react";
import { getScrobbles, getTopLists } from "./actions/lastfm";

type Track = {
  url: string;
  date: string | null;
  image: string;
  album: string;
  name: string;
  artist: string;
  nowPlaying: boolean;
};

type ScrobblesResult =
  | { error: string; username?: never; page?: never; totalPages?: never; tracks?: never }
  | { username: string; page: number; totalPages: number; tracks: Track[]; error?: never };

type RankedItem = {
  name: string;
  playcount: number;
  image: string;
  url: string;
  artist?: string;
};

type TopLists =
  | { albums: RankedItem[]; artists: RankedItem[]; error?: never }
  | { error: string; albums?: never; artists?: never };

export default function Home() {
  const [username, setUsername] = useState("");
  const [result, setResult] = useState<ScrobblesResult | null>(null);
  const [topLists, setTopLists] = useState<TopLists | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  async function searchScrobbles(nextPage = 1) {
    setLoading(true);
    setResult(null);
    if (nextPage === 1) setTopLists(null);

    const [data, lists] = await Promise.all([
      getScrobbles(username, nextPage),
      nextPage === 1 ? getTopLists(username) : Promise.resolve(null),
    ]);

    setResult(data);
    if (lists) setTopLists(lists);
    setPage(nextPage);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-neutral-950 p-6 text-white md:p-12">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-2 text-4xl font-bold">
          Last.fm Explorer
        </h1>

        <p className="mb-8 text-neutral-400">
          Search someone&apos;s recent listening history.
        </p>

        <form
          className="mb-8 flex flex-col gap-3 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            searchScrobbles(1);
          }}
        >
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Last.fm username"
            className="min-w-0 flex-1 border border-red-950 bg-neutral-900 px-4 py-3 outline-none focus:border-red-500"
            required
          />

          <button
            disabled={loading}
            className="bg-red-700 px-6 py-3 font-semibold text-white transition hover:bg-red-600 disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {result?.error && (
          <p className="mb-6 text-red-400">{result.error}</p>
        )}

        {result?.tracks && (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-semibold">
                Listening history: {result.username}
              </h2>
              <span className="text-sm text-neutral-400">
                Page {result.page} of {result.totalPages}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(190px,230px)_minmax(0,1fr)_minmax(190px,230px)]">
              <section
                aria-labelledby="top-albums-heading"
                className="order-1 border-t border-red-950 pt-4 xl:border-t-0 xl:border-r xl:border-red-950 xl:pt-0 xl:pr-5"
              >
                <h3 id="top-albums-heading" className="mb-4 text-sm font-bold uppercase tracking-wide text-red-400">
                  Top 5 albums
                </h3>
                {topLists?.error ? (
                  <p className="text-sm text-neutral-500">{topLists.error}</p>
                ) : (
                  <ol className="space-y-3">
                    {topLists?.albums?.map((album, index) => (
                      <li key={`${album.name}-${album.artist}`}>
                        <a
                          href={album.url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 gap-3 border-b border-neutral-800 pb-3 transition hover:text-red-300"
                        >
                          <span className="pt-1 text-sm font-bold text-red-500">{index + 1}</span>
                          {album.image ? (
                            <img src={album.image} alt="" className="h-12 w-12 shrink-0 object-cover" loading="lazy" />
                          ) : (
                            <div className="h-12 w-12 shrink-0 bg-neutral-800" />
                          )}
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{album.name}</span>
                            <span className="block truncate text-xs text-neutral-400">{album.artist}</span>
                            <span className="block text-xs text-neutral-500">{album.playcount.toLocaleString()} plays</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </section>

              <div className="order-2 grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {result.tracks.map((track, index) => (
                  <a
                    key={`${track.url}-${track.date}-${index}`}
                    href={track.url || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden border border-red-950 bg-neutral-900 transition hover:border-red-500"
                  >
                    {track.image ? (
                      <img
                        src={track.image}
                        alt={`Cover art for ${track.album}`}
                        className="aspect-square w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex aspect-square items-center justify-center bg-neutral-800 text-sm text-neutral-500">
                        No cover art
                      </div>
                    )}

                    <div className="p-4">
                      <h3 className="truncate font-semibold">{track.name}</h3>
                      <p className="truncate text-sm text-neutral-400">{track.artist}</p>
                      <p className="mt-1 truncate text-xs text-neutral-500">{track.album}</p>

                      {track.nowPlaying ? (
                        <p className="mt-3 text-xs text-red-400">Now playing</p>
                      ) : track.date ? (
                        <p className="mt-3 truncate text-xs text-neutral-500">
                          {new Date(track.date).toLocaleString()}
                        </p>
                      ) : null}
                    </div>
                  </a>
                ))}
              </div>

              <section
                aria-labelledby="top-artists-heading"
                className="order-3 border-t border-red-950 pt-4 xl:border-t-0 xl:border-l xl:pl-5 xl:pt-0"
              >
                <h3 id="top-artists-heading" className="mb-4 text-sm font-bold uppercase tracking-wide text-red-400">
                  Top 5 artists
                </h3>
                {topLists?.error ? (
                  <p className="text-sm text-neutral-500">{topLists.error}</p>
                ) : (
                  <ol className="space-y-3">
                    {topLists?.artists?.map((artist, index) => (
                      <li key={artist.name}>
                        <a
                          href={artist.url || "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="flex min-w-0 gap-2 border-b border-neutral-800 pb-3 transition hover:text-red-300"
                        >
                          <span className="pt-1 text-sm font-bold text-red-500">{index + 1}</span>
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-semibold">{artist.name}</span>
                            <span className="block text-xs text-neutral-500">{artist.playcount.toLocaleString()} plays</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            </div>

            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                disabled={loading || page <= 1}
                onClick={() => searchScrobbles(page - 1)}
                className="border border-red-950 px-4 py-2 transition hover:bg-red-950 disabled:opacity-30"
              >
                Previous
              </button>

              <button
                disabled={loading || page >= result.totalPages}
                onClick={() => searchScrobbles(page + 1)}
                className="border border-red-950 px-4 py-2 transition hover:bg-red-950 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
