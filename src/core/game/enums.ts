export enum EPower {
  MoveDownByTwo = 'Move_down_by_two',
  MoveUpByTwo = 'Move_up_by_two',
  Protect = 'Protect',
  RemoveBottom = 'Remove_bottom',
  RemoveMiddle = 'Remove_middle',
  RemoveTop = 'Remove_top',
  SwapNeighbours = 'Swap_neighbours',
  SwapThroughOne = 'Swap_through_one',
}

export enum EGameActionType {
  UseCard = 'use_card',
  PullCard = 'pull_card',
  ChangeCardToPulled = 'change_card_to_pulled',
  SelectOpenedCard = 'select_opened_card',
}
