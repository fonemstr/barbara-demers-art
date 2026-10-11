import { MigrateUpArgs } from '@payloadcms/db-postgres'

// Pippa's story was published as a journal post whose body is one image of
// the illustrated story page. Move it into Tales of Budderlee as "Pippa and
// the Last Candied Apple": the story text transcribed word for word from
// that page so it reads as text, her framed painting (the post's cover) at
// the top, and the illustrated page kept at the end. The journal post goes
// back to draft; /blog/Pippa-story-festival-candied-apples redirects to the
// tale. Skips quietly if the post or painting isn't there (fresh databases).
const POST_SLUG = 'Pippa-story-festival-candied-apples'
const RESIDENT_SLUG = 'pippa-duck-apples-budderlee'
const TALE_SLUG = 'pippa-and-the-last-candied-apple'

const STORY = [
  'Long before the sun reached the rooftops of Budderlee, Pippa was already busy in the kitchen of her little cottage on Willow Lane.',
  'A basket of apples sat beside the table, polished until their skins shone. Another batch waited patiently for their wooden sticks, while a neat row of finished candied apples cooled nearby, their glossy coating catching the early morning light.',
  'Pippa stood back and inspected them. “Those might be ribbon-worthy,” she said, pleased.',
  'By midmorning, Pippa was at the village green carrying her first trays to the festival tent. Olive arrived from the orchard soon afterward with another basket of beautiful apples. “These are the last of the best ones,” Olive said.',
  'Across the green, Maisie was arranging pies and other treats while villagers hurried about with pumpkins, baskets and ribbons. Every time Pippa looked up, she noticed something else that needed attention.',
  'A ribbon had come loose. A basket needed moving. Someone needed another tablecloth. Maisie needed an extra tray. Pippa took care of every one of them.',
  'By the morning of the festival, Budderlee had been transformed. Pumpkins lined the paths, autumn leaves danced across the cobblestones, and baskets overflowed with fruit from the orchard. Maisie’s pies filled the air with warm spices, and Pippa’s candied apples gleamed in tidy rows.',
  'The villagers began arriving. Pippa hardly noticed. She was straightening a table when Maisie appeared beside her. “Have you heard the music?” Maisie asked. “Not really,” Pippa admitted.',
  'Then Olive appeared on Pippa’s other side. “Come with us,” she said. “I can’t,” Pippa replied. “Look at the apple table. We’re already down to—”',
  'Olive gently took the cloth from Pippa’s wing. “There are plenty of apples.”',
  'For the first time all day, Pippa walked through the Harvest Festival carrying absolutely nothing. She heard the music. She noticed children running between the pumpkins and neighbors talking beneath the changing trees. She stopped to admire the decorations she had been too busy to see that morning.',
  'As evening settled over Budderlee, the air had grown noticeably colder. Pippa pulled her scarf a little tighter. Then something small and white landed on the sleeve of her dress. She looked down. Another landed beside it. “Snow?” Pippa said.',
  'All around the village green, faces began turning toward the sky. Theodore had been watching the weather all day. Now he appeared carrying a steaming pot from his tent. “I had a feeling we might need this,” he said.',
  'Before long, villagers were gathered together beneath the festival tents, warming their paws, wings and hooves around bowls of Theodore’s Pumpkin & Potato Harvest Soup as the snow fell faster.',
  'Eventually, Pippa wandered back toward her festival tent with Olive and Maisie. The trays were empty. Almost. One candied apple remained.',
  'Pippa reached automatically for a wrapper. Maisie looked at her. Pippa stopped. “Oh, all right.” She divided the last candied apple into three rather uneven pieces.',
  'The three friends stood together beneath the shelter, sharing it while snow softened the rooftops and cobblestones of Budderlee. Pippa looked around at her friends and neighbors—cold, laughing, eating and crowding together beneath the festival tents.',
  'Her candied apples had won a ribbon. But this was what she would remember.',
  'For once, Pippa left the empty tray exactly where it was.',
]

const paragraph = (text: string) => ({
  type: 'paragraph',
  version: 1,
  direction: 'ltr',
  format: '',
  indent: 0,
  textFormat: 0,
  textStyle: '',
  children: [{ type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal', style: '' }],
})

type LexicalNode = { type?: string; value?: unknown; children?: LexicalNode[] }

export async function up({ payload, req }: MigrateUpArgs): Promise<void> {
  const existing = await payload.find({ collection: 'tales', where: { slug: { equals: TALE_SLUG } }, limit: 1, req })
  if (existing.docs.length) return

  const posts = await payload.find({ collection: 'journal-posts', where: { slug: { equals: POST_SLUG } }, limit: 1, depth: 0, req })
  const post = posts.docs[0]
  const residents = await payload.find({ collection: 'paintings', where: { slug: { equals: RESIDENT_SLUG } }, limit: 1, depth: 0, req })
  const resident = residents.docs[0]
  if (!post || !resident) return

  // The illustrated story page sits in the post's body as an upload node.
  const body = post.body as { root?: { children?: LexicalNode[] } } | undefined
  const pageNode = body?.root?.children?.find((n) => n.type === 'upload')
  const pageId = pageNode && typeof pageNode.value === 'object' && pageNode.value
    ? (pageNode.value as { id?: number }).id
    : (pageNode?.value as number | undefined)
  const cover = typeof post.cover === 'object' && post.cover ? (post.cover as { id: number }).id : (post.cover as number | null | undefined)

  const children: unknown[] = STORY.map(paragraph)
  if (pageId) {
    children.push({
      type: 'upload',
      version: 3,
      format: '',
      id: 'pippa-story-page',
      fields: null,
      relationTo: 'media',
      value: pageId,
    })
  }

  await payload.create({
    collection: 'tales',
    req,
    data: {
      title: 'Pippa and the Last Candied Apple',
      slug: TALE_SLUG,
      resident: resident.id,
      excerpt: STORY[0],
      ...(cover ? { cover } : {}),
      body: {
        root: { type: 'root', version: 1, direction: 'ltr', format: '', indent: 0, children },
      } as never,
      featured: true,
      status: 'published',
      publishedAt: new Date().toISOString(),
    },
  })

  await payload.update({ collection: 'journal-posts', id: post.id, req, data: { status: 'draft' } })
}

// The tale and the draft journal post are content Barbara may edit, so
// nothing is undone automatically.
export async function down(): Promise<void> {}
