
"use server";

export async function getScrobbles(username, page = 1) {
  const apiKey = process.env.LASTFM_API_KEY;

  if (!apiKey) {
    return { error: "Missing Last.fm API key." };
  }

  const cleanUsername = username.trim();

  if (!cleanUsername || cleanUsername.length > 50) {
    return { error: "Enter a valid Last.fm username." };
  }

  const params = new URLSearchParams({
    method: "user.getRecentTracks",
    user: cleanUsername,
    api_key: apiKey,
    format: "json",
    limit: "23",
    page: String(Math.max(1, Number(page) || 1)),
  });

  try {
    const response = await fetch(
      `https://ws.audioscrobbler.com/2.0/?${params}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        error: data.message || "Could not retrieve scrobbles.",
      };
    }

    const result = data.recenttracks;
    const tracks = Array.isArray(result.track)
      ? result.track
      : result.track
        ? [result.track]
        : [];

    return {
      username: result["@attr"]?.user || cleanUsername,
      page: Number(result["@attr"]?.page || 1),
      totalPages: Number(result["@attr"]?.totalPages || 1),
      tracks: tracks.map((track) => ({
        name: track.name,
        artist: track.artist?.["#text"] || track.artist?.name || "Unknown artist",
        album: track.album?.["#text"] || "Unknown album",
        image:
          [...(track.image || [])]
            .reverse()
            .find((img) => img["#text"]?.trim())?.["#text"] || "",
        url: track.url || "",
        date: track.date?.uts
          ? new Date(Number(track.date.uts) * 1000).toISOString()
          : null,
        nowPlaying: track["@attr"]?.nowplaying === "true",
      })),
    };
  } catch {
    return { error: "Network error. Please try again." };
  }
}

export async function getTopLists(username) {
  const apiKey = process.env.LASTFM_API_KEY;

  if (!apiKey) {
    return { error: "Missing Last.fm API key." };
  }

  const cleanUsername = username.trim();

  if (!cleanUsername || cleanUsername.length > 50) {
    return { error: "Enter a valid Last.fm username." };
  }

  const createParams = (method) =>
    new URLSearchParams({
      method,
      user: cleanUsername,
      api_key: apiKey,
      format: "json",
      period: "overall",
      limit: "5",
    });

  try {
    const [albumsResponse, artistsResponse] = await Promise.all([
      fetch(`https://ws.audioscrobbler.com/2.0/?${createParams("user.getTopAlbums")}`, {
        cache: "no-store",
      }),
      fetch(`https://ws.audioscrobbler.com/2.0/?${createParams("user.getTopArtists")}`, {
        cache: "no-store",
      }),
    ]);
    const [albumsData, artistsData] = await Promise.all([
      albumsResponse.json(),
      artistsResponse.json(),
    ]);

    if (
      !albumsResponse.ok ||
      !artistsResponse.ok ||
      albumsData.error ||
      artistsData.error
    ) {
      return {
        error: albumsData.message || artistsData.message || "Could not retrieve top lists.",
      };
    }

    const toList = (items) => (Array.isArray(items) ? items : items ? [items] : []);
    const getImage = (images) =>
      [...(images || [])].reverse().find((image) => image["#text"]?.trim())?.["#text"] || "";

    return {
      albums: toList(albumsData.topalbums?.album).map((album) => ({
        name: album.name || "Unknown album",
        artist: album.artist?.name || "Unknown artist",
        playcount: Number(album.playcount) || 0,
        image: getImage(album.image),
        url: album.url || "",
      })),
      artists: toList(artistsData.topartists?.artist).map((artist) => ({
        name: artist.name || "Unknown artist",
        playcount: Number(artist.playcount) || 0,
        image: getImage(artist.image),
        url: artist.url || "",
      })),
    };
  } catch {
    return { error: "Network error. Please try again." };
  }
}
