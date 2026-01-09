import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

function val(v: string | string[] | undefined, fallback = ''): string {
  if (Array.isArray(v)) return v[0] || fallback
  return v || fallback
}

export default async function Image({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const name = val(searchParams.n, 'Företag')
  const city = val(searchParams.c)
  const rating = val(searchParams.r)
  const reviewCount = val(searchParams.rc)
  const discount = val(searchParams.d)
  const category = val(searchParams.cat)

  const hasRating = Boolean(rating)
  const hasDiscount = Boolean(discount)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          backgroundColor: '#0f172a',
          color: '#fff',
          position: 'relative',
          fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial',
        }}
      >
        {/* Background accents removed for Satori compatibility */}

        <div style={{ display: 'flex', flexDirection: 'column', padding: 64, width: '100%' }}>
          {/* Header row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              {category && (
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.15)',
                    padding: '8px 14px',
                    borderRadius: 999,
                    fontSize: 24,
                    fontWeight: 600,
                    letterSpacing: '0.2px',
                  }}
                >
                  {category}
                </div>
              )}
              {city && (
                <div
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.12)',
                    padding: '8px 14px',
                    borderRadius: 999,
                    fontSize: 22,
                    fontWeight: 500,
                  }}
                >
                  📍 {city}
                </div>
              )}
            </div>

            {hasDiscount && (
              <div
                style={{
                  background: 'linear-gradient(90deg, #22c55e, #16a34a)',
                  padding: '10px 18px',
                  borderRadius: 999,
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                {discount}
              </div>
            )}
          </div>

          {/* Title */}
          <div style={{ marginTop: 40, lineHeight: 1.05 }}>
            <div
              style={{
                fontSize: 68,
                fontWeight: 900,
                maxWidth: 980,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {name}
            </div>
          </div>

          {/* Meta */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 20 }}>
            {hasRating && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 12,
                  backgroundColor: 'rgba(255,255,255,0.12)',
                  fontSize: 28,
                  fontWeight: 700,
                }}
              >
                <div>⭐</div>
                <div>
                  {rating}
                  {reviewCount ? (
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600, marginLeft: 8 }}>
                      ({reviewCount})
                    </span>
                  ) : null}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 22, fontWeight: 500 }}>
              Boka städning enkelt – proffs nära dig
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  backgroundColor: '#22c55e',
                }}
              />
              <div style={{ fontSize: 24, fontWeight: 800 }}>foretag</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
