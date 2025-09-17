import { generateStoryboardImages, StoryboardData } from "../../src/mastra";

const input = {
  "storyboard": {
    "title": "Even a mistake can make a friend",
    "scenes": [
      {
        "sceneNumber": 1,
        "storyContent": "Birdsong fills the air as Harry strolls along a mossy path. Luna perches on his shoulder, preening a blue-spotted wing. Leaves shimmer and small critters peek out from ferns. Harry hums, tapping his overalls pocket in rhythm.\nHarry: Good morning, forest. Everyone get breakfast yet?\nSquirrel (chittering from a branch): Nuts are extra crunchy today!\nHarry: Crunchy is the best kind of nut.\nLuna: And I prefer breakfast with a side of sparkle. Any shiny beetles about?\nBeetle (from a log): Shiny, yes! Peck me not, please.\nHarry (giggling): She’s teasing, Mr. Beetle. We’re just passing through.\nLuna (softly to Harry): Keep those ears open, Blue Eyes. The woods are full of secrets today.",
        "imagePrompt": "Environment Anchor — Lush forest path dappled with sunlight: tall oaks and silver birches form a high canopy; a narrow moss-soft trail winds between fern beds and mushrooms; fallen logs and peeking critters nestle under leaves; color palette of emerald greens, mossy olives, and warm ambers; light shafts pierce foliage creating soft speckled highlights and gentle rim light. Character Anchors — Harry: age 7; small, sturdy; bright blue eyes; sandy-blond tousled hair; round rosy-cheeked face; curious, gentle, brave-in-small-ways; wearing light cream cotton shirt with rolled sleeves under faded blue denim overalls (brass buttons, single chest pocket) and scuffed brown leather ankle boots, clean but well-worn. Luna: unusually large raven with glossy midnight-black plumage scattered with cobalt-blue spots, keen black eyes, charcoal beak; wearing natural plumage only (no clothing). Squirrel: spry red squirrel with tufted ears, fluffy tail, bright amber eyes; wearing natural fur only (no clothing). Beetle: small iridescent green ground beetle with metallic sheen; wearing natural exoskeleton only (no clothing). Action/Mood — Harry strolls and hums, tapping his overalls pocket; Luna perches on his shoulder, preening a blue-spotted wing; Squirrel chatters from a branch above; Beetle gleams on a nearby log, wary but unharmed; mood cheerful and curious. Camera/Composition/Lighting — Medium wide shot at child’s eye level; leading line of the winding path; Harry and Luna framed slightly off-center with Squirrel in the upper third, Beetle on a foreground log; sun-dappled lighting with soft bokeh in the background.",
        "location": "Lush forest path, dappled with sunlight",
        "timeOfDay": "Morning"
      },
      {
        "sceneNumber": 2,
        "storyContent": "In a small clearing, a bright-pink rabbit braces her feet and tugs at an orange tip sticking from the soil. The grasses sway as she grunts and pulls to no avail.\nPippa: One... two... three—heave! Oh, carrot, come on!\nHarry (approaching kindly): Need a tug-buddy?\nPippa (startled, then hopeful): Hi! I’m Pippa. I promised my family the biggest carrot in the whole glade.\nLuna (tilting her head): It’s either a very stubborn carrot or it’s been doing tail-lifts.\nPippa (giggles): Help me count? On three!\nHarry: Ready. One... two... three!",
        "imagePrompt": "Environment Anchor — Sunny glade with tall grasses and wildflowers: open clearing ringed by birch trunks, knee-high grasses sway with daisies, buttercups, and blue cornflowers; a light breeze ripples seed heads; colors are saturated meadow greens and flower pastels; bright, clean sunlight with soft shadows. Character Anchors — Pippa: vibrant pink rabbit with warm-brown eyes, long expressive ears, white heart-shaped chest patch, springy build; wearing natural fur only (no clothing). Harry: age 7; small, sturdy; bright blue eyes; sandy-blond tousled hair; round rosy-cheeked face; curious, gentle; wearing light cream cotton shirt with rolled sleeves under faded blue denim overalls (brass buttons, single chest pocket) and scuffed brown leather ankle boots. Luna: unusually large raven with glossy black plumage dotted with cobalt-blue spots, intelligent black eyes, charcoal beak; wearing natural plumage only (no clothing). Action/Mood — Pippa braces and tugs at an orange tip in the soil, determined; Harry approaches kindly, ready to help count; Luna tilts her head, amused; mood playful, hopeful. Camera/Composition/Lighting — Medium shot with a slight low angle to emphasize the tall grasses; Pippa foreground center gripping the orange tip, Harry entering from left, Luna perched on his shoulder; bright late-morning sunlight, soft breeze motion in grasses.",
        "location": "Sunny glade with tall grasses and wildflowers",
        "timeOfDay": "Late Morning"
      },
      {
        "sceneNumber": 3,
        "storyContent": "Harry and Pippa tug. The orange tip jerks, then a surprised yelp bubbles up from underground. A mole pops out—wide-eyed—revealing the “carrot” is his tail, dusty and offended.\nMorris: Yipe! Mind my tail! That’s no vegetable—it’s attached to me!\nPippa (hopping back, horrified): Oh no, oh no! I’m so sorry! I thought—\nHarry (hands raised gently): We didn’t mean to hurt you, Mr. Mole. I can understand you. Are you okay?\nMorris (rubbing his tail): A bit ruffled, lad. My tunnels are delicate! Imagine someone yanking your hat.\nLuna (soothing): His hat is his tail today. Deep breaths, everyone.\nPippa (ears drooping): I only wanted a carrot for supper. I wasn’t looking closely.\nHarry: Let’s fix this. Maybe we can help mend any tunnel mishaps and find a real carrot nearby.",
        "imagePrompt": "Environment Anchor — Edge of a burrow near the glade: low mound of loose earth veined with roots; round burrow mouth edged by wiry grasses and clover; crumbs of soil and rootlets scattered; earthy tones of umber and tan against fresh greens; crisp midday light with short shadows. Character Anchors — Harry: age 7; small, sturdy; bright blue eyes; sandy-blond tousled hair; gentle, brave-in-small-ways; wearing light cream cotton shirt with rolled sleeves under faded blue denim overalls (brass buttons, single chest pocket) and scuffed brown leather ankle boots. Pippa: vibrant pink rabbit with warm-brown eyes, long ears, white heart patch; wearing natural fur only (no clothing). Morris: mole with velvety brown fur, small eyes, pink sensitive tail, spade-like paws, pink nose dusted with soil; proud yet soft-hearted; wearing natural fur only (no clothing). Luna: unusually large raven with glossy black plumage dotted with cobalt-blue spots; wearing natural plumage only (no clothing). Action/Mood — The burrow erupts as Morris pops up, tail dusty and offended; Harry and Pippa freeze mid-tug, startled; Luna leans in soothingly; mood surprised then apologetic. Camera/Composition/Lighting — Dynamic close-to-ground medium shot from the burrow’s edge; Morris centered emerging from the hole, Pippa recoiling right, Harry to left with open hands, Luna on his shoulder; crisp overhead midday light casting short shadows and highlighting flying soil.",
        "location": "Edge of a burrow near the glade",
        "timeOfDay": "Midday"
      },
      {
        "sceneNumber": 4,
        "storyContent": "Morris guides them with soft thumps along his tunnel. The ground hums underfoot. They arrive at a patch where ferny tops feather from the soil. Sunlight paints everything gold-green.\nMorris (sniffing): Hm. Carrot-scent to the east. Real ones.\nHarry (kneeling): We’ll pull carefully, straight up.\nPippa (determined, smiling): I’ll do it gently this time.\nLuna: I’ll supervise from above—chief of crow-safety and carrot-cheer.\nPippa (steady pull): One… two… three… got it!\nMorris (grinning): Splendid root—no tails attached.\nHarry: Thank you, Morris. Your tunnels led us right here.\nMorris (bashful): Well, I do know my underground. Apology accepted, Miss Pippa. No hard feelings.\nPippa (relieved): Friends?\nMorris: Friends.",
        "imagePrompt": "Environment Anchor — Field edge with a real carrot patch: dark loamy soil studded with rows of ferny carrot tops; beyond, the meadow blurs to gold-green; dragonflies flit over leaves; palette of rich greens and warm golds; afternoon sun, warm and directional. Character Anchors — Harry: age 7; small, sturdy; blue-eyed; sandy-blond hair; kind focus; wearing light cream cotton shirt with rolled sleeves under faded blue denim overalls (brass buttons, single chest pocket) and scuffed brown leather ankle boots. Pippa: vibrant pink rabbit, warm-brown eyes, long ears, white heart chest patch; wearing natural fur only (no clothing). Morris: velvety brown mole, small eyes, pink sensitive tail, spade paws; wearing natural fur only (no clothing). Luna: unusually large raven with cobalt-blue spots on glossy black plumage; wearing natural plumage only (no clothing). Action/Mood — Pippa gently pulls a real carrot straight up, smiling; Harry kneels nearby guiding; Morris noses the soil proudly; Luna hovers above as “chief of carrot-cheer”; mood cooperative, relieved, friendly. Camera/Composition/Lighting — Medium side shot at knee height; carrot patch rows form leading lines; Pippa center with carrot emerging, Harry left kneeling, Morris foreground near a small tunnel mound, Luna above mid-frame; warm afternoon light with soft shadows and golden highlights.",
        "location": "Field edge with a real carrot patch",
        "timeOfDay": "Afternoon"
      },
      {
        "sceneNumber": 5,
        "storyContent": "They share crunchy carrot slices atop a mossy log. Luna balances a carrot coin on her beak; Harry laughs. Fireflies blink on as the sky turns peach and lavender.\nLuna (muffled by carrot coin): Behold! The Great Balancing Beak!\nHarry (clapping): Bravo, Luna!\nPippa (nibbling happily): Best supper ever—and best surprise, too.\nMorris (content): A tidy tail, a fixed tunnel, and new friends. Not a bad day for a mole.\nHarry (smiling at them all): Even a mistake can make a friend, if we listen and make it right.\nLuna (warmly): To new friends—and properly identified vegetables!\nAll (laughing): To friends!",
        "imagePrompt": "Environment Anchor — Woodland clearing under a warm sunset: mossy log as a low bench, ringed by soft grass and tiny mushrooms; fireflies wink among ferns; sky painted peach and lavender filtering through treetops; long, golden-pink rim light and gentle shadows. Character Anchors — Harry: age 7; small, sturdy; blue eyes; sandy-blond tousled hair; friendly smile; wearing light cream cotton shirt with rolled sleeves under faded blue denim overalls (brass buttons, single chest pocket) and scuffed brown leather ankle boots. Luna: unusually large raven with glossy black plumage dotted with cobalt-blue spots; wearing natural plumage only (no clothing). Pippa: vibrant pink rabbit with warm-brown eyes, long ears, white heart chest patch; wearing natural fur only (no clothing). Morris: velvety brown mole with pink sensitive tail and spade paws; wearing natural fur only (no clothing). Action/Mood — Friends sit and share carrot slices on the mossy log; Luna balances a carrot coin on her beak as Harry claps; Pippa nibbles contentedly; Morris relaxes, satisfied; mood warm, joyful, newly bonded. Camera/Composition/Lighting — Wide, cozy group shot at low seated height; characters arranged in a gentle arc atop the log; soft sunset glow with peach-lavender sky, firefly bokeh twinkling in the background; gentle backlight creating warm rim light.",
        "location": "Woodland clearing under a warm sunset",
        "timeOfDay": "Sunset"
      }
    ],
    "characters": [
      {
        "name": "Harry",
        "description": "Character Anchor: Harry — age 7; ethnicity: unspecified; small, sturdy build; bright blue eyes; sandy-blond, tousled hair with a cowlick; round face with rosy cheeks; gentle, curious expression; quick, warm smile. Core persona: curious, gentle, and brave in small ways, able to understand and speak with animals. Attire Anchor: light cream cotton shirt with rolled sleeves under faded blue denim overalls (brass buttons, single chest pocket), scuffed brown leather ankle boots; clothes are clean but well-worn and practical.",
        "role": "Protagonist"
      },
      {
        "name": "Luna",
        "description": "Character Anchor: Luna — unusually large raven; glossy midnight-black plumage scattered with distinct cobalt-blue spots across wings and shoulders; keen, intelligent coal-black eyes; charcoal beak; strong, elegant posture, often perched on Harry’s shoulder. Core persona: witty, watchful, fond of shiny jokes. Attire Anchor: natural plumage only (no clothing).",
        "role": "Supporting"
      },
      {
        "name": "Pippa",
        "description": "Character Anchor: Pippa — vibrant pink rabbit; compact, springy build; soft rose-pink fur with a lighter pink belly and inner ears; large warm-brown eyes; long expressive ears; a tiny white heart-shaped patch of fur on her chest. Core persona: lively, boundless energy, determined to find the biggest carrot for supper. Attire Anchor: natural fur only (no clothing).",
        "role": "Supporting"
      },
      {
        "name": "Morris",
        "description": "Character Anchor: Morris — mole with velvety chocolate-brown fur; small, near-sight eyes; broad spade-like forepaws perfect for digging; pink, sensitive tail; soft pink nose dusted with soil; whiskers twitching. Core persona: proud of his carefully dug tunnels, quick to startle, soft-hearted underneath. Attire Anchor: natural fur only (no clothing).",
        "role": "Antagonist"
      },
      {
        "name": "Squirrel",
        "description": "Character Anchor: Squirrel — spry red squirrel; tufted ears; fluffy plume tail; bright amber eyes; nimble paws clutching a nut; quick, chittery manner. Core persona: cheerful, chatty forager. Attire Anchor: natural fur only (no clothing).",
        "role": "Supporting"
      },
      {
        "name": "Beetle",
        "description": "Character Anchor: Beetle — small iridescent green ground beetle; metallic emerald sheen on chitin; delicate jointed legs; tiny antennae; reflective, shiny surface. Core persona: cautious but polite. Attire Anchor: natural exoskeleton only (no clothing).",
        "role": "Supporting"
      }
    ]
  },
  "style": "Coloring Book"
}

jest.setTimeout(10000);

describe('Image generation', () => {
  it("generates images", async () => {
    const result = await generateStoryboardImages(input.storyboard as unknown as  StoryboardData, {
      style: input.style,
      quality: "standard"
    })

    const workflowState = result.getWorkflowState();

    expect(result).toBeDefined()
  })
});