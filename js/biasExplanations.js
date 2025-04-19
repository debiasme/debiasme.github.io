const biasExplanations = {
  Age: {
    what: "Age bias involves making assumptions about people's abilities, behaviors, or characteristics based solely on their age. This can affect both younger and older individuals.",
    why: [
      "Lead to discrimination in various settings",
      "Overlook valuable experience or fresh perspectives",
      "Create artificial barriers to participation",
      "Disregard individual capabilities and potential",
    ],
  },
  Gender: {
    what: "Gender bias involves treating someone differently based on their gender, often reflecting stereotypes or prejudices rather than individual characteristics.",
    why: [
      "Perpetuate harmful stereotypes",
      "Create unequal opportunities",
      "Lead to unfair evaluation of skills and abilities",
      "Limit diversity of thought and perspective",
    ],
  },
  Representation: {
    what: "Representation bias occurs when data samples or selection processes don't accurately reflect the diversity of the entire population they're meant to represent.",
    why: [
      "Lead to skewed research outcomes",
      "Exclude important perspectives from consideration",
      "Reinforce existing inequalities in systems",
      "Result in solutions that don't work for all groups",
    ],
  },

  // Human Bias - Individual
  Behavioral: {
    what: "Behavioral bias occurs when assumptions are made about how someone will act based on stereotypes or limited observations rather than actual patterns of behavior.",
    why: [
      "Create unfair expectations for individuals",
      "Lead to misjudgment of people's intentions and actions",
      "Influence interactions based on preconceptions",
      "Limit opportunities for those affected by the bias",
    ],
  },
  Interpretation: {
    what: "Interpretation bias involves skewing the meaning or significance of information based on preconceptions or expectations rather than objective analysis.",
    why: [
      "Distort understanding of evidence and facts",
      "Lead to inaccurate conclusions",
      "Reinforce existing beliefs despite contrary evidence",
      "Create barriers to effective communication",
    ],
  },
  "Belief persistence/principle": {
    what: "Belief persistence bias involves holding onto established beliefs despite new information that contradicts them, often rejecting evidence that challenges existing views.",
    why: [
      "Prevent adaptation to new information",
      "Lead to outdated approaches and solutions",
      "Impede progress and innovation",
      "Create resistance to necessary changes",
    ],
  },
  "Selective adherence": {
    what: "Selective adherence bias involves inconsistently applying principles or standards to favor certain outcomes or groups.",
    why: [
      "Create unfair advantages for certain individuals or groups",
      "Undermine fairness and equity in decision-making",
      "Lead to inconsistent treatment of similar situations",
      "Damage trust in processes and systems",
    ],
  },
  "Spotlight effect": {
    what: "Spotlight effect bias involves overestimating how much others notice or care about one's actions or appearance, leading to skewed self-perception and communication.",
    why: [
      "Create unnecessary anxiety or self-consciousness",
      "Lead to decisions based on imagined judgments",
      "Distort understanding of social dynamics",
      "Impede authentic expression and communication",
    ],
  },
  "Situation framing": {
    what: "Situation framing bias occurs when a scenario is presented in a way that influences perception, emphasizing certain aspects while downplaying others.",
    why: [
      "Manipulate understanding of problems or solutions",
      "Direct attention away from important factors",
      "Lead to decisions based on incomplete information",
      "Control narratives to support specific viewpoints",
    ],
  },
  "Human expertise": {
    what: "Human expertise bias involves overvaluing or undervaluing human judgment compared to other sources (like algorithms or diverse perspectives), often based on status or credentials.",
    why: [
      "Lead to over-reliance on individual opinion over data",
      "Dismiss valuable input from diverse or unexpected sources",
      "Create hierarchies that inhibit collaboration",
      "Result in suboptimal decision-making processes",
    ],
  },
  Presentation: {
    what: "Presentation bias occurs when judgments are influenced by how information is displayed, formatted, or communicated rather than its substantive content.",
    why: [
      "Favor style over substance in evaluation",
      "Lead to overlooking valuable content due to formatting",
      "Create advantages for those skilled in presentation",
      "Result in decisions based on superficial factors",
    ],
  },
  Ranking: {
    what: "Ranking bias involves the tendency to create and rely on hierarchies even when distinctions between items or people are minimal or arbitrary.",
    why: [
      "Create artificial distinctions between similar options",
      "Amplify small differences into significant judgments",
      "Lead to unfair allocations of resources or opportunities",
      "Overlook collaborative or non-hierarchical approaches",
    ],
  },

  // Human Bias - Group
  Groupthink: {
    what: "Groupthink occurs when the desire for harmony or conformity results in irrational or dysfunctional decision-making, with alternatives not being properly considered.",
    why: [
      "Suppress dissenting opinions and critical thinking",
      "Lead to incomplete analysis of options",
      "Reinforce consensus at the expense of accuracy",
      "Result in poor decisions due to inadequate consideration of alternatives",
    ],
  },
  Bandwagon: {
    what: "Bandwagon bias is the tendency to adopt beliefs or behaviors because they are popular or others are doing them, rather than through independent evaluation.",
    why: [
      "Lead to decisions without proper individual evaluation",
      "Create artificial trends that lack substance",
      "Suppress minority viewpoints even when correct",
      "Result in inefficient allocation of resources and attention",
    ],
  },
  Deployment: {
    what: "Deployment bias involves systematically favoring certain approaches, technologies, or solutions based on familiarity rather than appropriateness for the situation.",
    why: [
      "Lead to suboptimal solutions for problems",
      "Create resistance to new and potentially better approaches",
      "Waste resources by applying inappropriate methods",
      "Slow progress and innovation in organizations",
    ],
  },
  "Sunk cost fallacy": {
    what: "Sunk cost fallacy is the tendency to continue an endeavor due to previously invested resources (time, money, effort) despite new evidence suggesting it's no longer beneficial.",
    why: [
      "Lead to persisting with failing strategies or investments",
      "Prevent rational reallocation of resources",
      "Create resistance to admitting mistakes",
      "Result in continual escalation of commitment to bad decisions",
    ],
  },

  // Human Bias - Cognitive
  Confirmation: {
    what: "Confirmation bias involves seeking, interpreting, favoring, and recalling information in a way that confirms one's existing beliefs while giving disproportionately less attention to alternative possibilities.",
    why: [
      "Create intellectual echo chambers",
      "Lead to dismissal of valid contradictory evidence",
      "Reinforce possibly incorrect beliefs",
      "Impede balanced evaluation of information",
    ],
  },
  Anchoring: {
    what: "Anchoring bias is the tendency to rely too heavily on the first piece of information encountered (the 'anchor') when making decisions, even if that information is irrelevant.",
    why: [
      "Distort judgment about appropriate values or scales",
      "Create artificial reference points for evaluation",
      "Lead to predictable manipulation in negotiations",
      "Result in decisions overly influenced by initial frames",
    ],
  },
  "Availability heuristic": {
    what: "Availability heuristic bias involves judging the likelihood of events based on how easily examples come to mind, overestimating the probability of memorable or recent events.",
    why: [
      "Lead to overestimation of dramatic but rare risks",
      "Create underestimation of common but less memorable hazards",
      "Result in resource misallocation for risk management",
      "Skew perception of trends based on recent events",
    ],
  },
  "Dunning-Kruger effect": {
    what: "The Dunning-Kruger effect involves people with limited knowledge or competence overestimating their abilities, while those with high ability underestimating theirs.",
    why: [
      "Lead to unwarranted confidence in unqualified individuals",
      "Create challenges in accurate self-assessment",
      "Result in improper task allocation and leadership",
      "Impede proper recognition of expertise and competence",
    ],
  },
  "Implicit bias": {
    what: "Implicit bias involves unconscious attitudes or stereotypes that affect our understanding, actions, and decisions in an unconscious manner.",
    why: [
      "Influence decisions without conscious awareness",
      "Create systematic disadvantages for certain groups",
      "Lead to unintended discrimination",
      "Persist despite explicit egalitarian values",
    ],
  },
  "Automation complacency": {
    what: "Automation complacency is the tendency to over-rely on automated systems, assuming they are more accurate or reliable than they actually are.",
    why: [
      "Lead to reduced vigilance in monitoring automated systems",
      "Create vulnerability to automation failures",
      "Result in degradation of human skills over time",
      "Impede appropriate intervention when automation is incorrect",
    ],
  },

  // Statistical/Computational Bias - Selection and Sampling
  "Data generation": {
    what: "Data generation bias occurs when the processes used to create or collect data systematically favor certain outcomes or perspectives.",
    why: [
      "Create foundational flaws in datasets",
      "Lead to algorithms that perpetuate existing biases",
      "Result in skewed baselines for evaluation",
      "Establish misleading ground truth references",
    ],
  },
  Detection: {
    what: "Detection bias occurs when the methodology used to identify or measure phenomena is more likely to find certain types of results than others.",
    why: [
      "Lead to overrepresentation of easily detected phenomena",
      "Create systematic gaps in understanding complex issues",
      "Result in misleading perceptions of prevalence",
      "Establish flawed metrics for evaluation",
    ],
  },
  "Collective fallacy": {
    what: "Collective fallacy bias involves drawing conclusions about individuals based on group data, or about groups based on individual cases.",
    why: [
      "Lead to stereotyping individuals based on group statistics",
      "Create oversimplified understanding of complex groups",
      "Result in inappropriate application of general trends to specific cases",
      "Establish faulty reasoning about statistical significance",
    ],
  },
  Evaluation: {
    what: "Evaluation bias occurs when assessment methods systematically advantage certain groups or approaches over others, despite similar merit.",
    why: [
      "Create uneven playing fields in competitions or assessments",
      "Lead to reinforcement of existing advantages",
      "Result in misleading measures of quality or effectiveness",
      "Establish self-perpetuating cycles of advantage",
    ],
  },
  Selection: {
    what: "Selection bias occurs when the sample data selected for analysis is not representative of the population it's intended to analyze.",
    why: [
      "Lead to findings that don't generalize to the broader population",
      "Create distorted understanding of phenomena",
      "Result in solutions optimized for limited use cases",
      "Establish misleading benchmarks for comparison",
    ],
  },
  Treatment: {
    what: "Treatment bias involves systematic differences in how cases are handled, often based on factors unrelated to their actual needs or characteristics.",
    why: [
      "Lead to unequal allocation of resources or attention",
      "Create disparities in outcomes for similar cases",
      "Result in some groups receiving consistently different interventions",
      "Establish patterns that can amplify existing inequities",
    ],
  },
  Assignment: {
    what: "Assignment bias involves non-random allocation of subjects to conditions in ways that systematically affect outcomes.",
    why: [
      "Create invalid experimental results",
      "Lead to false conclusions about cause and effect",
      "Result in misleading evidence about interventions",
      "Establish inappropriate standards of practice",
    ],
  },
  Popularity: {
    what: "Popularity bias occurs when frequently occurring or highly visible items receive disproportionate weight in analysis or recommendations.",
    why: [
      "Lead to reinforcement of already dominant options",
      "Create barriers to discovery of novel or niche alternatives",
      "Result in systems that lack diversity in outputs",
      "Establish feedback loops that amplify existing trends",
    ],
  },
  Population: {
    what: "Population bias occurs when the group being studied doesn't properly reflect the characteristics of the target population to which results will be applied.",
    why: [
      "Lead to solutions that work poorly for underrepresented groups",
      "Create blind spots in understanding diverse needs",
      "Result in misaligned priorities for research and development",
      "Establish inequitable systems and products",
    ],
  },
  "Simpson's Paradox": {
    what: "Simpson's Paradox occurs when a trend appears in different groups of data but disappears or reverses when the groups are combined.",
    why: [
      "Lead to misleading conclusions when data is aggregated",
      "Create confusion about appropriate levels of analysis",
      "Result in contradictory findings from the same dataset",
      "Establish potential for manipulation through selective grouping",
    ],
  },
  Temporal: {
    what: "Temporal bias occurs when timing-related factors systematically influence the collection or interpretation of data.",
    why: [
      "Lead to conclusions that don't hold across different time periods",
      "Create false patterns due to seasonal or cyclical factors",
      "Result in misunderstanding of trends over time",
      "Establish inappropriate baseline periods for comparison",
    ],
  },
  Uncertainty: {
    what: "Uncertainty bias involves systematic errors in how unknowns, probabilities, and confidence intervals are represented and interpreted.",
    why: [
      "Lead to overconfidence in predictions",
      "Create misrepresentation of the reliability of findings",
      "Result in poor risk assessment and management",
      "Establish false certainty in decision-making",
    ],
  },

  // Statistical/Computational Bias - Processing/Validation
  Amplification: {
    what: "Amplification bias occurs when analysis or algorithmic processes magnify small differences or existing patterns in data, creating exaggerated outcomes.",
    why: [
      "Lead to reinforcement of minor trends into major distinctions",
      "Create unjustified confidence in subtle patterns",
      "Result in systems that exacerbate existing inequities",
      "Establish feedback loops that increase polarization",
    ],
  },
  Inherited: {
    what: "Inherited bias occurs when new systems or analyses adopt and perpetuate biases present in the predecessors they build upon.",
    why: [
      "Lead to persistence of historical biases in new systems",
      "Create compounding of errors across generations of tools",
      "Result in obscured origins of problematic patterns",
      "Establish outdated assumptions in modern applications",
    ],
  },
  "Error propagation": {
    what: "Error propagation bias occurs when mistakes or inaccuracies in early stages of analysis compound through subsequent steps, creating systematically skewed outcomes.",
    why: [
      "Lead to magnification of small initial errors",
      "Create cascading failures in complex systems",
      "Result in difficult-to-detect sources of inaccuracy",
      "Establish reduced reliability in multi-step processes",
    ],
  },
  "Model selection": {
    what: "Model selection bias involves choosing analytical frameworks or algorithms that favor certain types of patterns or outcomes over others.",
    why: [
      "Lead to systematic blindness to certain relationships in data",
      "Create preference for familiar or convenient explanations",
      "Result in overlooking important but complex patterns",
      "Establish inappropriate constraints on possible interpretations",
    ],
  },
  Regression: {
    what: "Regression bias involves systematic errors in statistical models, particularly when predicting values for groups that differ from the majority in the training data.",
    why: [
      "Lead to predictions biased toward the average case",
      "Create systematically different accuracy across groups",
      "Result in models that reinforce status quo distributions",
      "Establish unfair outcomes for underrepresented groups",
    ],
  },

  // Statistical/Computational Bias - Use and Interpretation
  Activity: {
    what: "Activity bias occurs when systems or analyses disproportionately represent or favor users/subjects with higher levels of engagement.",
    why: [
      "Lead to systems optimized for heavy users rather than all users",
      "Create invisibility of passive or occasional participants",
      "Result in skewed understanding of user needs and behaviors",
      "Establish feedback loops that reward certain interaction patterns",
    ],
  },
  "Concept drift": {
    what: "Concept drift bias occurs when the meaning or context of data changes over time, but models or interpretations remain fixed, creating increasing inaccuracy.",
    why: [
      "Lead to decreasing model performance over time",
      "Create inappropriate application of outdated concepts",
      "Result in failure to adapt to evolving social contexts",
      "Establish systems that become progressively misaligned with reality",
    ],
  },
  Energy: {
    what: "Energy bias occurs when systems or processes favor options with lower computational, cognitive, or resource costs, regardless of their true value.",
    why: [
      "Lead to preference for simpler but less accurate approaches",
      "Create avoidance of thorough but resource-intensive methods",
      "Result in systematic underinvestment in complex problems",
      "Establish patterns of cutting corners in analytical processes",
    ],
  },
  "Feedback loop": {
    what: "Feedback loop bias occurs when the outputs of a system influence future inputs, creating self-reinforcing patterns that amplify initial tendencies or errors.",
    why: [
      "Lead to increasing extremes in system outputs over time",
      "Create artificial trends based on system behavior rather than reality",
      "Result in difficulty distinguishing genuine from system-generated patterns",
      "Establish potentially destructive self-reinforcing cycles",
    ],
  },
  "Data bridging": {
    what: "Data bridging bias occurs when conclusions are inappropriately transferred between different domains, populations, or contexts without adequate validation.",
    why: [
      "Lead to misapplication of findings beyond their valid scope",
      "Create false assumptions of universality for context-specific patterns",
      "Result in inappropriate generalization across different populations",
      "Establish flawed foundations for decision-making in new domains",
    ],
  },

  // Systemic Bias
  Historical: {
    what: "Historical bias refers to inequities, prejudices, or unfair patterns embedded in data and systems due to historical practices, policies, or social structures.",
    why: [
      "Perpetuate past injustices in current systems",
      "Create persistent advantages for historically privileged groups",
      "Result in modern systems that mirror historical inequities",
      "Establish barriers to equity despite current intentions",
    ],
  },
  Societal: {
    what: "Societal bias reflects and reinforces existing social prejudices, stereotypes, or inequalities that are prevalent in the broader culture.",
    why: [
      "Normalize and reinforce harmful cultural stereotypes",
      "Create systems that mirror rather than correct social inequities",
      "Result in technologies that amplify societal prejudices",
      "Establish barriers to equal participation for marginalized groups",
    ],
  },
  Institutional: {
    what: "Institutional bias involves policies, practices, and procedures within organizations that systematically advantage certain groups while disadvantaging others.",
    why: [
      "Create structural barriers to equity within organizations",
      "Lead to persistent disparities despite individual good intentions",
      "Result in seemingly neutral processes with discriminatory outcomes",
      "Establish self-perpetuating systems of advantage and disadvantage",
    ],
  },
};

export default biasExplanations;
